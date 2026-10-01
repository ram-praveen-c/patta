"""
Cadastral Matching, Area Validation, and Georeferencing Engine
Implements the core Patta-to-Cadastral Parcel Localization architecture:
- Cadastral Parcel Matching (Hierarchy: District -> Taluk -> Village -> Panchayat -> Survey -> Subdivision)
- Objective Area Consistency Validation (Standard survey tolerances, neutral reporting)
- Scanned Panchayat Map Georeferencing (Affine & Polynomial least-squares with RMSE)
- Strict adherence to Rule #7: NEVER fabricate coordinates or arbitrary boundaries
"""

import math
import re
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon

from survey_normalizer import normalize_survey_identifier, match_normalized_surveys


# ==========================================
# 1. AREA UNIT CONVERSION & VALIDATION
# ==========================================

UNIT_CONVERSIONS_TO_SQM = {
    "sqm": 1.0,
    "sq_m": 1.0,
    "square_meter": 1.0,
    "square_meters": 1.0,
    "m2": 1.0,
    "sqft": 0.092903,
    "sq_ft": 0.092903,
    "square_feet": 0.092903,
    "acre": 4046.86,
    "acres": 4046.86,
    "ஏக்கர்": 4046.86,
    "cent": 40.4686,
    "cents": 40.4686,
    "சென்ட்": 40.4686,
    "hectare": 10000.0,
    "hectares": 10000.0,
    "ஹெக்டேர்": 10000.0,
    "எக்டேர்": 10000.0,
    "are": 100.0,
    "ares": 100.0,
    "ஆர்": 100.0,
    "gunta": 101.17,
    "guntas": 101.17,
    "குண்டா": 101.17,
}


def parse_area_to_sqm(area_input: Any, unit_hint: Optional[str] = None) -> Tuple[Optional[float], str]:
    """
    Parses a raw area string or numeric value and converts to square meters (m²).
    Returns (area_in_sqm, original_unit_detected).
    """
    if area_input is None:
        return None, "unknown"

    if isinstance(area_input, (int, float)):
        val = float(area_input)
        if unit_hint and unit_hint.lower() in UNIT_CONVERSIONS_TO_SQM:
            return round(val * UNIT_CONVERSIONS_TO_SQM[unit_hint.lower()], 2), unit_hint
        return round(val, 2), "sqm"

    area_str = str(area_input).strip()
    if not area_str:
        return None, "unknown"

    # Check for Tamil Nadu Patta standard Hectare-Are-Sqm notation: e.g. "0.40.50" (0 Hectare, 40 Ares, 50 Sqm)
    h_a_sqm = re.search(r'(\d+)\.(\d{1,2})\.(\d{1,2})', area_str)
    if h_a_sqm:
        hec = float(h_a_sqm.group(1))
        ares = float(h_a_sqm.group(2))
        sqm = float(h_a_sqm.group(3))
        total_sqm = (hec * 10000.0) + (ares * 100.0) + sqm
        return round(total_sqm, 2), "hectare_are_sqm"

    # Extract numeric magnitude
    num_match = re.search(r'[\d,.]+', area_str)
    if not num_match:
        return None, "unknown"

    try:
        val = float(num_match.group(0).replace(',', ''))
    except ValueError:
        return None, "unknown"

    area_lower = area_str.lower()
    for unit_key, factor in UNIT_CONVERSIONS_TO_SQM.items():
        if unit_key in area_lower:
            return round(val * factor, 2), unit_key

    if unit_hint and unit_hint.lower() in UNIT_CONVERSIONS_TO_SQM:
        return round(val * UNIT_CONVERSIONS_TO_SQM[unit_hint.lower()], 2), unit_hint

    # Default to square meters if no recognizable unit
    return round(val, 2), "sqm"


def calculate_polygon_geodesic_area_sqm(geometry: Any) -> float:
    """
    Calculates geodesic surface area of a GeoJSON polygon in square meters.
    Geometry coordinates are [longitude, latitude] in EPSG:4326.
    """
    try:
        # Handle list of coordinate points [[lat, lon], ...] or GeoJSON dict
        if isinstance(geometry, list):
            # If coordinates are [lat, lon], convert to shapely [(lon, lat), ...]
            ring = []
            for pt in geometry:
                if len(pt) >= 2:
                    ring.append((pt[1], pt[0]))
            if len(ring) < 3:
                return 0.0
            if ring[0] != ring[-1]:
                ring.append(ring[0])
            poly = Polygon(ring)
        elif isinstance(geometry, dict):
            poly = shape(geometry)
        else:
            return 0.0

        if not poly.is_valid:
            poly = poly.buffer(0)

        # Authalic Earth Radius: R = 6371007.2 m
        # Planar projection centered at centroid latitude for local high accuracy
        centroid = poly.centroid
        lat_rad = math.radians(centroid.y)
        m_per_deg_lat = 111132.92 - 559.82 * math.cos(2 * lat_rad) + 1.175 * math.cos(4 * lat_rad)
        m_per_deg_lon = 111412.84 * math.cos(lat_rad) - 93.5 * math.cos(3 * lat_rad)

        if isinstance(poly, Polygon):
            coords = list(poly.exterior.coords)
        elif isinstance(poly, MultiPolygon):
            coords = list(poly.geoms[0].exterior.coords)
        else:
            return 0.0

        # Shoelace formula with meter-scaled coordinates
        area = 0.0
        n = len(coords)
        for i in range(n - 1):
            x1 = coords[i][0] * m_per_deg_lon
            y1 = coords[i][1] * m_per_deg_lat
            x2 = coords[i + 1][0] * m_per_deg_lon
            y2 = coords[i + 1][1] * m_per_deg_lat
            area += (x1 * y2) - (x2 * y1)

        return round(abs(area) * 0.5, 2)
    except Exception as e:
        print(f"Error calculating geodesic area: {e}")
        return 0.0


def validate_parcel_area(patta_area_input: Any, gis_area_sqm: float) -> Dict[str, Any]:
    """
    Validates Patta area against official GIS cadastral parcel area.
    Never asserts fraudulent claims; outputs objective scientific consistency ratings.
    """
    patta_sqm, detected_unit = parse_area_to_sqm(patta_area_input)

    if patta_sqm is None or patta_sqm <= 0:
        return {
            "patta_area_sqm": None,
            "gis_area_sqm": round(gis_area_sqm, 2),
            "area_difference": None,
            "area_difference_percentage": None,
            "validation_status": "Insufficient Area Data",
            "message": "Patta document did not specify a legible numerical area value.",
            "requires_verification": True
        }

    abs_diff = round(abs(patta_sqm - gis_area_sqm), 2)
    pct_diff = round((abs_diff / patta_sqm) * 100.0, 2)

    # Classifications per cadastral survey tolerances
    if pct_diff <= 2.0:
        status = "Consistent"
        msg = f"Document area ({patta_sqm:.1f} m²) matches Cadastral GIS parcel ({gis_area_sqm:.1f} m²) within standard 2% survey tolerance."
        req_verif = False
    elif pct_diff <= 5.0:
        status = "Minor difference"
        msg = f"Minor area difference of {pct_diff:.1f}% ({abs_diff:.1f} m²). Within acceptable historical measurement variations."
        req_verif = False
    elif pct_diff <= 15.0:
        status = "Significant difference"
        msg = f"Notable area deviation of {pct_diff:.1f}% ({abs_diff:.1f} m²). Verification of subdivision boundaries is recommended."
        req_verif = True
    else:
        status = "Requires manual verification"
        msg = f"Area mismatch detected ({pct_diff:.1f}% difference). Document records {patta_sqm:.1f} m² while GIS parcel measures {gis_area_sqm:.1f} m². Manual survey verification is recommended."
        req_verif = True

    return {
        "patta_area_sqm": patta_sqm,
        "gis_area_sqm": round(gis_area_sqm, 2),
        "area_difference": abs_diff,
        "area_difference_percentage": pct_diff,
        "validation_status": status,
        "message": msg,
        "requires_verification": req_verif
    }


# ==========================================
# 2. GEOREFERENCING ENGINE FOR SCANNED MAPS
# ==========================================

def compute_affine_transformation(gcps: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Computes 2D Affine Transformation from pixel coordinates (u, v) to geographic coordinates (lon, lat).
    x = a0 + a1*u + a2*v
    y = b0 + b1*u + b2*v
    Requires minimum 3 non-collinear Ground Control Points (GCPs).
    """
    if len(gcps) < 3:
        return {
            "georeferenced": False,
            "status": "Map is not georeferenced.",
            "reason": f"Insufficient control points. Found {len(gcps)}, minimum 3 required for affine georeferencing.",
            "min_points_required": 3
        }

    # Build design matrix
    U = []
    V = []
    LON = []
    LAT = []

    for pt in gcps:
        U.append(float(pt.get("pixel_x", 0)))
        V.append(float(pt.get("pixel_y", 0)))
        LON.append(float(pt.get("lon", 0)))
        LAT.append(float(pt.get("lat", 0)))

    N = len(gcps)
    A = np.column_stack([np.ones(N), U, V])

    try:
        # Solve least squares for lon: [a0, a1, a2]
        c_lon, res_lon, rank_lon, s_lon = np.linalg.lstsq(A, LON, rcond=None)
        # Solve least squares for lat: [b0, b1, b2]
        c_lat, res_lat, rank_lat, s_lat = np.linalg.lstsq(A, LAT, rcond=None)

        # Calculate Root Mean Square Error (RMSE)
        pred_lon = A @ c_lon
        pred_lat = A @ c_lat
        err_lon = LON - pred_lon
        err_lat = LAT - pred_lat

        # Ground distance error in meters (approx at mean latitude)
        mean_lat_rad = math.radians(np.mean(LAT))
        m_lon = 111320.0 * math.cos(mean_lat_rad)
        m_lat = 110540.0
        err_meters = np.sqrt((err_lon * m_lon)**2 + (err_lat * m_lat)**2)
        rmse_meters = float(np.sqrt(np.mean(err_meters**2)))

        return {
            "georeferenced": True,
            "status": "Map is georeferenced.",
            "transform_type": "affine",
            "gcp_count": N,
            "coefficients": {
                "lon": [float(x) for x in c_lon],
                "lat": [float(y) for y in c_lat]
            },
            "rmse_meters": round(rmse_meters, 3),
            "is_calibrated": True
        }
    except Exception as e:
        return {
            "georeferenced": False,
            "status": "Map is not georeferenced.",
            "reason": f"Transformation matrix inversion failed: {str(e)}",
            "min_points_required": 3
        }


def compute_georeferenced_bounds(
    transform_coeffs: Dict[str, List[float]],
    img_width: int,
    img_height: int
) -> List[List[float]]:
    """
    Transforms the 4 corners of the scanned raster image to geographic bounds
    for display in Leaflet as an ImageOverlay: [[min_lat, min_lon], [max_lat, max_lon]]
    """
    c_lon = transform_coeffs["lon"]
    c_lat = transform_coeffs["lat"]

    corners_pixel = [
        (0, 0),
        (img_width, 0),
        (img_width, img_height),
        (0, img_height)
    ]

    lons = []
    lats = []
    for u, v in corners_pixel:
        lon = c_lon[0] + c_lon[1] * u + c_lon[2] * v
        lat = c_lat[0] + c_lat[1] * u + c_lat[2] * v
        lons.append(lon)
        lats.append(lat)

    return [
        [min(lats), min(lons)],
        [max(lats), max(lons)]
    ]


# ==========================================
# 3. PARCEL MATCHING ENGINE
# ==========================================

def match_cadastral_parcel(
    query_params: Dict[str, Any],
    candidate_parcels: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Cadastral parcel matching engine according to strict priority:
    1. District
    2. Taluk
    3. Village
    4. Panchayat
    5. Survey Number
    6. Subdivision

    Strictly satisfies Rule #7:
    - Never generates random coordinates
    - Never uses default coordinates
    - Returns exact parcel when found
    - Returns approximate administrative location when only village is found
    - Never returns fake boundaries
    """
    target_district = (query_params.get("district") or "").strip().lower()
    target_taluk = (query_params.get("taluk") or "").strip().lower()
    target_village = (query_params.get("village") or "").strip().lower()
    target_panchayat = (query_params.get("panchayat") or "").strip().lower()
    raw_survey = query_params.get("survey_number")
    raw_subdiv = query_params.get("subdivision")
    patta_area_val = query_params.get("patta_area")

    # 1. Normalize query survey identifiers
    norm_survey = normalize_survey_identifier(raw_survey)
    search_survey_num = norm_survey.get("survey_number")
    search_subdiv = (raw_subdiv or norm_survey.get("subdivision") or "").strip().upper()

    if not search_survey_num:
        return {
            "location_status": "insufficient_information",
            "message": "Valid survey number is required to locate the cadastral parcel.",
            "match_type": "none",
            "parcel": None
        }

    # 2. Filter candidates by administrative hierarchy
    def score_administrative_context(p: Dict[str, Any]) -> int:
        score = 0
        p_dist = (p.get("district") or "").strip().lower()
        p_tal = (p.get("taluk") or "").strip().lower()
        p_vil = (p.get("village") or "").strip().lower()
        p_pan = (p.get("panchayat") or "").strip().lower()

        if target_district and p_dist and (target_district in p_dist or p_dist in target_district):
            score += 8
        if target_taluk and p_tal and (target_taluk in p_tal or p_tal in target_taluk):
            score += 16
        if target_panchayat and p_pan and (target_panchayat in p_pan or p_pan in target_panchayat):
            score += 32
        if target_village and p_vil and (target_village in p_vil or p_vil in target_village):
            score += 64

        return score

    # Check survey & subdivision matches
    exact_matches = []
    survey_only_matches = []
    village_matches = []

    for p in candidate_parcels:
        admin_score = score_administrative_context(p)

        # Track parcels in same administrative area
        if admin_score > 0:
            village_matches.append(p)

        p_survey = p.get("survey_no") or p.get("survey_number")
        p_subdiv = p.get("subdivision")

        is_match, m_type, conf = match_normalized_surveys(
            search_survey_num, search_subdiv, p_survey, p_subdiv
        )

        if is_match:
            record_match = {
                "parcel": p,
                "admin_score": admin_score,
                "match_type": m_type,
                "confidence": conf
            }
            if m_type == "exact":
                exact_matches.append(record_match)
            else:
                survey_only_matches.append(record_match)

    # Sort matches by administrative score descending
    exact_matches.sort(key=lambda x: x["admin_score"], reverse=True)
    survey_only_matches.sort(key=lambda x: x["admin_score"], reverse=True)

    # Handle Multiple Exact Matches (e.g. across different villages or panchayats)
    if len(exact_matches) > 1 and exact_matches[0]["admin_score"] == exact_matches[1]["admin_score"]:
        return {
            "location_status": "multiple_matches",
            "message": "Multiple parcels matched the supplied survey information. Additional subdivision or administrative context is required.",
            "candidate_count": len(exact_matches),
            "match_type": "multiple_exact",
            "candidates": [m["parcel"] for m in exact_matches[:5]]
        }

    # Case A: Exact Match Found
    if exact_matches:
        best = exact_matches[0]["parcel"]
        m_type = "exact"
        # Validate Area
        geometry = best.get("geometry")
        gis_area = float(best.get("area_sqm") or calculate_polygon_geodesic_area_sqm(geometry))
        area_report = validate_parcel_area(patta_area_val, gis_area)

        return {
            "location_status": "parcel_found",
            "match_type": "exact",
            "level": "LEVEL 1: Exact Parcel Location",
            "level_description": "Exact parcel identified from cadastral/GIS data.",
            "survey_number": best.get("survey_no") or search_survey_num,
            "subdivision": best.get("subdivision") or search_subdiv,
            "village": best.get("village", target_village),
            "panchayat": best.get("panchayat", target_panchayat),
            "taluk": best.get("taluk", target_taluk),
            "district": best.get("district", target_district),
            "geometry": geometry,
            "centroid": best.get("centroid"),
            "owner": best.get("owner"),
            "classification": best.get("classification"),
            "patta_area": area_report["patta_area_sqm"],
            "gis_area": area_report["gis_area_sqm"],
            "area_difference": area_report["area_difference"],
            "area_difference_percentage": area_report["area_difference_percentage"],
            "area_validation_status": area_report["validation_status"],
            "area_validation_message": area_report["message"],
            "confidence": {
                "ocr": query_params.get("ocr_confidence", 0.92),
                "survey_match": norm_survey.get("confidence", 0.95),
                "location_match": 1.0 if exact_matches[0]["admin_score"] > 0 else 0.85,
                "parcel_match": 1.0,
                "overall": 0.98
            },
            "source": best.get("source", "Cadastral Survey GIS")
        }

    # Case B: Survey Match Found without exact Subdivision
    if survey_only_matches:
        if len(survey_only_matches) > 1:
            return {
                "location_status": "multiple_matches",
                "message": f"Found {len(survey_only_matches)} subdivisions for Survey No. {search_survey_num}. Please specify a subdivision to identify exact boundaries.",
                "candidate_count": len(survey_only_matches),
                "match_type": "survey_only_multiple",
                "candidates": [m["parcel"] for m in survey_only_matches]
            }

        best = survey_only_matches[0]["parcel"]
        geometry = best.get("geometry")
        gis_area = float(best.get("area_sqm") or calculate_polygon_geodesic_area_sqm(geometry))
        area_report = validate_parcel_area(patta_area_val, gis_area)

        return {
            "location_status": "parcel_found",
            "match_type": "survey_only",
            "level": "LEVEL 1: Survey-Level Parcel Location",
            "level_description": "Survey parcel identified from cadastral data; subdivision not specified or partially matched.",
            "survey_number": best.get("survey_no") or search_survey_num,
            "subdivision": best.get("subdivision"),
            "village": best.get("village", target_village),
            "panchayat": best.get("panchayat", target_panchayat),
            "taluk": best.get("taluk", target_taluk),
            "district": best.get("district", target_district),
            "geometry": geometry,
            "centroid": best.get("centroid"),
            "owner": best.get("owner"),
            "classification": best.get("classification"),
            "patta_area": area_report["patta_area_sqm"],
            "gis_area": area_report["gis_area_sqm"],
            "area_difference": area_report["area_difference"],
            "area_difference_percentage": area_report["area_difference_percentage"],
            "area_validation_status": area_report["validation_status"],
            "area_validation_message": area_report["message"],
            "confidence": {
                "ocr": query_params.get("ocr_confidence", 0.90),
                "survey_match": norm_survey.get("confidence", 0.90),
                "location_match": 0.85,
                "parcel_match": 0.75,
                "overall": 0.82
            },
            "source": best.get("source", "Cadastral Survey GIS")
        }

    # Case C: Village Map Available but Survey Parcel not Found
    if village_matches:
        # Approximate administrative location from known village parcel cluster
        village_pts = [p["centroid"] for p in village_matches if p.get("centroid")]
        avg_lat = sum(pt[0] for pt in village_pts) / len(village_pts) if village_pts else None
        avg_lon = sum(pt[1] for pt in village_pts) / len(village_pts) if village_pts else None

        return {
            "location_status": "map_available_but_parcel_not_found",
            "match_type": "village_context",
            "level": "LEVEL 2: Approximate Administrative Location",
            "level_description": "Approximate administrative location — Parcel boundary unavailable in current cadastral map.",
            "survey_number": search_survey_num,
            "subdivision": search_subdiv,
            "village": target_village or village_matches[0].get("village"),
            "panchayat": target_panchayat or village_matches[0].get("panchayat"),
            "taluk": target_taluk or village_matches[0].get("taluk"),
            "district": target_district or village_matches[0].get("district"),
            "geometry": None,
            "centroid": [avg_lat, avg_lon] if avg_lat and avg_lon else None,
            "patta_area": parse_area_to_sqm(patta_area_val)[0],
            "gis_area": None,
            "confidence": {
                "ocr": query_params.get("ocr_confidence", 0.85),
                "survey_match": norm_survey.get("confidence", 0.85),
                "location_match": 0.70,
                "parcel_match": 0.0,
                "overall": 0.50
            },
            "message": f"Cadastral map is available for this village, but Survey No. {search_survey_num} could not be matched."
        }

    # Case D: No cadastral map for this village
    return {
        "location_status": "map_not_available",
        "match_type": "none",
        "level": "LEVEL 3: Location Unresolved",
        "level_description": "Exact location unavailable — Cadastral GIS map not registered for this Panchayat/Village.",
        "survey_number": search_survey_num,
        "subdivision": search_subdiv,
        "village": target_village,
        "panchayat": target_panchayat,
        "taluk": target_taluk,
        "district": target_district,
        "geometry": None,
        "centroid": None,
        "patta_area": parse_area_to_sqm(patta_area_val)[0],
        "gis_area": None,
        "confidence": {
            "ocr": query_params.get("ocr_confidence", 0.80),
            "survey_match": norm_survey.get("confidence", 0.80),
            "location_match": 0.0,
            "parcel_match": 0.0,
            "overall": 0.20
        },
        "message": "Exact parcel location could not be determined from the available cadastral data."
    }
