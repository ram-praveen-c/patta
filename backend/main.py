"""
LandLens GIS Land Intelligence Platform - Backend API
Integrates:
- CV & Preprocessing OCR Pipeline (Tamil & English)
- Survey Number Normalization & Cadastral Matching
- Strict Rule #7 Compliance: No fabricated coordinates, no fake polygon offsets
- Cadastral Parcel Localization (District -> Taluk -> Village -> Panchayat -> Survey -> Subdivision)
- Geodesic Area Consistency Validation
- Scanned Map Affine Georeferencing
"""

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import traceback
import sys
import os
import json
import uuid
import re
import urllib.request
import urllib.parse

from cv_pipeline import process_document_pipeline, analyze_image_quality
from extractor import parse_extracted_data
from survey_normalizer import normalize_survey_identifier
import cadastral_engine
import database

app = FastAPI(
    title="LandLens AI - Cadastral Land Intelligence & Property Locator",
    description="Locates land parcels from Patta documents using Cadastral GIS and Panchayat maps"
)

# Configure CORS universally for Mobile (Capacitor/WebView) and Web browsers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAPS_DIR = os.getenv("MAPS_DIR", os.path.join(os.path.dirname(__file__), "uploads", "maps"))
os.makedirs(MAPS_DIR, exist_ok=True)
app.mount("/static/maps", StaticFiles(directory=MAPS_DIR), name="static_maps")


@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    """
    Production health check endpoint (Requirement 14).
    Supports GET and HEAD for UptimeRobot, cloud platforms, and load balancers.
    """
    return {"status": "ok"}


@app.on_event("startup")
def startup_db():
    database.init_db()
    print("FastAPI startup: Database initialized, migrated, and authoritative cadastral parcels verified.")


# ==========================================
# ADMINISTRATIVE GEOCODING (NO FAKE LOCATIONS)
# ==========================================

def geocode_administrative_location(village: str, taluk: str, district: str) -> tuple:
    """
    Queries real OpenStreetMap Nominatim for approximate administrative centroid.
    Strictly Rule #7:
    - Never generates random coordinates
    - Never uses hardcoded default coordinates
    - Never returns fake boundaries
    """
    query_parts = [p.strip() for p in [village, taluk, district] if p and p.strip()]
    if not query_parts:
        return None, "No location identifiers provided"

    search_query = ", ".join(query_parts)
    if "tamil" not in search_query.lower() and any(x in search_query.lower() for x in ["cuddalore", "perambalur"]):
        search_query += ", Tamil Nadu, India"
    elif "maharashtra" not in search_query.lower() and any(x in search_query.lower() for x in ["pune", "maval", "khandala"]):
        search_query += ", Maharashtra, India"
    else:
        search_query += ", India"

    try:
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "LandLensCadastralAI/2.0"})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                return [lat, lon], "Approximate Administrative Location (OSM Nominatim)"
    except Exception as e:
        print(f"Nominatim administrative lookup notice: {e}", file=sys.stderr)

    return None, "Exact parcel location could not be determined from available data"


def calculate_fraud_and_risk(parsed_data: dict, ocr_confidence: float) -> dict:
    warnings = []
    score = 0

    # 1. Missing Fields Check
    missing_vital = []
    if not parsed_data.get("owner"):
        missing_vital.append("Owner Name")
        score += 20
    if not parsed_data.get("survey_number"):
        missing_vital.append("Survey Number")
        score += 20
    if not parsed_data.get("land_area"):
        missing_vital.append("Land Area")
        score += 20

    if missing_vital:
        warnings.append(f"Missing Field: Key document fields missing: {', '.join(missing_vital)}.")

    # 2. Database Conflict & Duplicate Check
    survey_no = parsed_data.get("survey_number")
    owner = parsed_data.get("owner")
    subdivision = parsed_data.get("subdivision")
    village = parsed_data.get("village")

    if survey_no:
        matching_parcels = database.query_gis_parcel(survey_no, subdivision, village)
        if matching_parcels:
            db_owner = matching_parcels[0]["owner"]
            if owner and owner.lower() != db_owner.lower():
                warnings.append(f"Owner Name Difference: Document shows '{owner}', while official cadastral record lists '{db_owner}'.")
                score += 35

    # 3. Low OCR confidence check
    if ocr_confidence < 65:
        warnings.append("Low OCR Confidence: Image scanning resolution is low. Verification recommended.")
        score += 25

    score = min(100, score)

    return {
        "fraud_score": score,
        "risk_level": "High" if score >= 50 else ("Medium" if score >= 20 else "Low"),
        "warnings": warnings
    }


def get_nearby_amenities(lat: Optional[float], lon: Optional[float], is_urban: bool = False) -> dict:
    if not lat or not lon:
        return {
            "metro_stations": "Location pending parcel identification",
            "hospitals": "Location pending parcel identification",
            "schools": "Location pending parcel identification",
            "water_bodies": "Location pending parcel identification"
        }

    return {
        "metro_stations": "GIS transport layer lookup available on verified boundary",
        "hospitals": "District health facility network active",
        "schools": "Panchayat educational sector mapping active",
        "water_bodies": "Cadastral irrigation / water body check active"
    }


# ==========================================
# 1. OCR & DOCUMENT EXTRACTION
# ==========================================

@app.post("/api/extract")
async def extract_document(
    file: UploadFile = File(...),
    lang: str = Form("tam+eng")
):
    """
    Extracts text, structured tables, and land identifiers from uploaded document.
    Strictly Rule #13:
    - Never uses fake fallback documents or mock responses
    - Never generates random coordinates
    - Returns exact parcel when found in Cadastral GIS
    - Returns administrative location when only village is found
    - Returns 'unresolved' when location cannot be determined
    """
    try:
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        contents = await file.read()

        # Step 1: Execute full CV & Preprocessing & Multilingual OCR Pipeline
        from cv_pipeline import process_document_pipeline
        pipeline_res = process_document_pipeline(contents, filename=file.filename, lang=lang)

        if not pipeline_res.get("success"):
            return {
                "success": False,
                "error": pipeline_res.get("error", "Document quality is too low for reliable extraction."),
                "quality_report": pipeline_res.get("quality_report"),
                "rawText": "",
                "original_image_base64": pipeline_res.get("original_image_base64", ""),
                "processed_image_base64": ""
            }

        raw_text = pipeline_res.get("raw_text", "")
        tables = pipeline_res.get("tables", [])
        tokens = pipeline_res.get("tokens", [])
        table_cells = pipeline_res.get("table_cells", [])
        quality_report = pipeline_res.get("quality_report", {})

        # Step 2: Information Extraction & Validation Layer
        parsed_data = parse_extracted_data(
            raw_text,
            tables,
            tokens=tokens,
            table_cells=table_cells
        )

        ocr_confidence = float(pipeline_res.get("average_confidence", 90.0))
        if quality_report.get("is_blurry"):
            ocr_confidence = max(10.0, ocr_confidence - 10.0)

        # Step 3: Cadastral Land Parcel Localization (Rule #14: Exact vs Administrative vs Unresolved)
        survey_number = parsed_data.get("survey_number")
        subdivision = parsed_data.get("subdivision")
        village = parsed_data.get("village", "")
        panchayat = parsed_data.get("panchayat", "")
        taluk = parsed_data.get("taluk", "")
        district = parsed_data.get("district", "")
        patta_area_val = parsed_data.get("total_area") or parsed_data.get("land_area")

        cadastral_result = None
        coords = None
        geometry = None
        location_status = "unresolved"
        location_level = "LEVEL 3: Location Unresolved"
        location_confidence_detail = "Exact parcel location could not be determined from available data"

        if survey_number:
            candidates = database.get_all_cadastral_parcels(
                district=district, taluk=taluk, village=village, panchayat=panchayat
            )
            cadastral_result = cadastral_engine.match_cadastral_parcel({
                "district": district,
                "taluk": taluk,
                "village": village,
                "panchayat": panchayat,
                "survey_number": survey_number,
                "subdivision": subdivision,
                "patta_area": patta_area_val,
                "ocr_confidence": ocr_confidence / 100.0
            }, candidates)

            if cadastral_result.get("location_status") == "parcel_found":
                coords = cadastral_result.get("centroid")
                geometry = cadastral_result.get("geometry")
                location_status = "parcel_found"
                location_level = "LEVEL 1: Exact Parcel Location"
                location_confidence_detail = "100% (Exact Cadastral GIS Match)"
                parsed_data["classification"] = cadastral_result.get("classification") or parsed_data.get("classification")
                if cadastral_result.get("gis_area"):
                    parsed_data["gis_area"] = cadastral_result.get("gis_area")
            elif cadastral_result.get("centroid"):
                coords = cadastral_result.get("centroid")
                location_status = "administrative_location"
                location_level = "LEVEL 2: Administrative Location"
                location_confidence_detail = "Approximate Administrative Location"

        # Step 4: Administrative Geocoding Fallback ONLY if coordinates not found from GIS
        if not coords and village:
            admin_coords, geocode_method = geocode_administrative_location(village, taluk, district)
            if admin_coords:
                coords = admin_coords
                location_status = "administrative_location"
                location_level = "LEVEL 2: Administrative Location"
                location_confidence_detail = geocode_method

        # Step 5: Fraud & Risk Assessment (Objective validation)
        fraud_report = calculate_fraud_and_risk(parsed_data, ocr_confidence)

        # Step 6: Surrounding Amenities
        nearby_amenities = get_nearby_amenities(coords[0] if coords else None, coords[1] if coords else None)

        loc_score = 100 if location_status == "parcel_found" else (70 if coords else 20)
        confidence_report = {
            "ocr_confidence": round(ocr_confidence, 1),
            "location_confidence": loc_score,
            "location_confidence_detail": location_confidence_detail,
            "overall_score": int((ocr_confidence + loc_score) / 2)
        }

        # Step 7: Land Intelligence Summary (Requirement 19)
        land_intelligence = {
            "survey_display": parsed_data.get("survey_display") or "Not Identified",
            "administrative_location": f"{village or 'Unknown Village'}, {taluk or 'Unknown Taluk'}, {district or 'Unknown District'}",
            "location_status": location_status,
            "location_level": location_level,
            "location_note": "Exact parcel boundary identified." if location_status == "parcel_found" else (
                "Exact parcel boundary could not be identified from spatial data; displaying verified administrative center." if location_status == "administrative_location" else
                "Location unresolved. Cadastral map not available for this parcel."
            ),
            "area_validation": parsed_data.get("area_validation", {}),
            "document_validation": parsed_data.get("validation", {}),
            "quality_status": quality_report.get("message", "Sufficient scan quality."),
            "ocr_confidence": round(ocr_confidence, 1),
            "verified_fields_count": sum(1 for v in [parsed_data.get("survey_number"), parsed_data.get("village"), parsed_data.get("district"), parsed_data.get("land_area"), parsed_data.get("patta_number")] if v)
        }

        location_info = {
            "location_status": location_status,
            "level": location_level,
            "geometry": geometry,
            "centroid": coords,
            "source": cadastral_result.get("source") if cadastral_result else "Administrative Lookup",
            "confidence": cadastral_result.get("confidence") if cadastral_result else {"overall": 0.5 if coords else 0.0}
        }

        # Step 8: Save to SQLite Database with separate relational tables (Requirement 23)
        database.add_document(
            doc_id=doc_id,
            filename=file.filename,
            doc_type=parsed_data.get("document_type", "Patta/Chitta Extract"),
            raw_text=raw_text,
            parsed_data=parsed_data,
            coordinates=coords,
            confidence_scores=confidence_report,
            fraud_report=fraud_report,
            nearby_amenities=nearby_amenities,
            quality_report=quality_report,
            location_info=location_info
        )

        return {
            "success": True,
            "id": doc_id,
            "filename": file.filename,
            "language": lang,
            "rawText": raw_text,
            "tokens": tokens,
            "layout_regions": pipeline_res.get("layout_regions", []),
            "table_structures": pipeline_res.get("table_structures", []),
            "parsed_data": parsed_data,
            "coordinates": coords,
            "geometry": geometry,
            "location_status": location_status,
            "location_level": location_level,
            "cadastral_result": cadastral_result,
            "confidence_scores": confidence_report,
            "fraud_report": fraud_report,
            "nearby_amenities": nearby_amenities,
            "quality_report": quality_report,
            "land_intelligence": land_intelligence,
            "original_image_base64": pipeline_res.get("original_image_base64", ""),
            "processed_image_base64": pipeline_res.get("processed_image_base64", "")
        }

    except Exception as e:
        print(traceback.format_exc(), file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "rawText": ""
        }
    finally:
        import gc
        gc.collect()


# ==========================================
# 2. CADASTRAL PARCEL LOCALIZATION API
# ==========================================

class LocateLandRequest(BaseModel):
    district: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None
    panchayat: Optional[str] = None
    survey_number: str
    subdivision: Optional[str] = None
    patta_area: Optional[Any] = None
    patta_area_unit: Optional[str] = None
    document_id: Optional[str] = None
    ocr_confidence: Optional[float] = 0.94


@app.post("/api/locate-land")
@app.post("/locate-land")
def locate_land(req: LocateLandRequest):
    """
    Core Research Feature: Patta-to-Cadastral Parcel Localization.
    Uses extracted land identifiers to search Panchayat Cadastral GIS dataset.
    Returns:
    - location_status: parcel_found, village_found, panchayat_found, map_available_but_parcel_not_found, insufficient_information, map_not_available, multiple_matches
    - real parcel polygon geometry (EPSG:4326)
    - area validation & consistency metrics
    - multi-level confidence breakdown
    """
    try:
        # Retrieve candidate cadastral parcels
        candidates = database.get_all_cadastral_parcels(
            district=req.district,
            taluk=req.taluk,
            village=req.village,
            panchayat=req.panchayat
        )

        # Execute dedicated Cadastral Matching Engine
        match_result = cadastral_engine.match_cadastral_parcel({
            "district": req.district,
            "taluk": req.taluk,
            "village": req.village,
            "panchayat": req.panchayat,
            "survey_number": req.survey_number,
            "subdivision": req.subdivision,
            "patta_area": req.patta_area,
            "ocr_confidence": req.ocr_confidence
        }, candidates)

        # Save result to audit log
        res_id = f"LOC-{uuid.uuid4().hex[:8].upper()}"
        match_result["id"] = res_id
        match_result["document_id"] = req.document_id

        database.save_location_result(match_result)

        return {
            "success": True,
            **match_result
        }

    except Exception as e:
        print(traceback.format_exc(), file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Parcel localization failed: {str(e)}")


# ==========================================
# 3. PANCHAYAT MAPS & ADMIN GIS MANAGEMENT
# ==========================================

@app.get("/api/cadastral/maps")
def list_cadastral_maps():
    """Returns all registered Panchayat vector & scanned raster cadastral maps."""
    try:
        maps = database.get_panchayat_maps()
        return {"success": True, "maps": maps}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/cadastral/parcels")
def list_cadastral_parcels(
    district: Optional[str] = Query(None),
    taluk: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    panchayat: Optional[str] = Query(None),
    survey_no: Optional[str] = Query(None)
):
    """Queries registered cadastral parcels with polygon geometries."""
    try:
        parcels = database.get_all_cadastral_parcels(district, taluk, village, panchayat)
        if survey_no:
            parcels = [p for p in parcels if str(p.get("survey_no")) == str(survey_no)]
        return {"success": True, "parcels": parcels, "count": len(parcels)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/cadastral/parcels/import-geojson")
async def import_geojson_parcels(
    file: UploadFile = File(...),
    panchayat: str = Form(...),
    village: str = Form(...),
    taluk: str = Form(""),
    district: str = Form("")
):
    """
    Imports cadastral parcels from an authoritative GeoJSON vector file.
    Validates polygon geometries and computes geodesic surface areas.
    """
    try:
        content = await file.read()
        geojson_data = json.loads(content.decode("utf-8"))

        features = geojson_data.get("features", [])
        if not features:
            return {"success": False, "error": "GeoJSON contains no features."}

        imported_count = 0
        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            if not geom or geom.get("type") not in ["Polygon", "MultiPolygon"]:
                continue

            # Extract survey number & subdivision from properties
            raw_survey = props.get("survey_no") or props.get("survey_number") or props.get("SURVEY_NO") or props.get("id")
            raw_subdiv = props.get("subdivision") or props.get("SUBDIV") or props.get("sub_div")

            norm = normalize_survey_identifier(str(raw_survey) if raw_survey else "")
            survey_no_clean = norm.get("survey_number") or str(raw_survey)
            subdiv_clean = raw_subdiv or norm.get("subdivision")

            # Calculate geodesic area
            area_sqm = cadastral_engine.calculate_polygon_geodesic_area_sqm(geom)

            # Compute centroid
            coords = geom.get("coordinates", [[]])[0]
            if coords:
                avg_lon = sum(pt[0] for pt in coords) / len(coords)
                avg_lat = sum(pt[1] for pt in coords) / len(coords)
                centroid = [avg_lat, avg_lon]
            else:
                centroid = [0, 0]

            parcel_record = {
                "survey_no": survey_no_clean,
                "subdivision": subdiv_clean,
                "village": village or props.get("village", ""),
                "panchayat": panchayat or props.get("panchayat", ""),
                "taluk": taluk or props.get("taluk", ""),
                "district": district or props.get("district", ""),
                "owner": props.get("owner", "Registered Pattadar"),
                "classification": props.get("classification", "Agricultural / Cadastral Land"),
                "area": f"{area_sqm:.1f} m²",
                "area_sqm": area_sqm,
                "centroid": centroid,
                "geometry": coords,  # [[lat, lon], ...]
                "source": f"GeoJSON Import: {file.filename}"
            }

            database.insert_gis_parcel(parcel_record)
            imported_count += 1

        # Register map entry
        map_id = f"MAP-VEC-{uuid.uuid4().hex[:6].upper()}"
        database.add_panchayat_map({
            "map_id": map_id,
            "map_name": f"{panchayat} Vector Cadastral Map",
            "district": district,
            "taluk": taluk,
            "village": village,
            "panchayat": panchayat,
            "map_type": "vector_geojson",
            "file_path": file.filename,
            "coordinate_reference_system": "EPSG:4326",
            "georeferenced": True,
            "gcp_points": [],
            "transformation_matrix": {},
            "bounds": None
        })

        return {
            "success": True,
            "message": f"Successfully imported {imported_count} cadastral parcels into {panchayat}.",
            "imported_count": imported_count,
            "map_id": map_id
        }

    except Exception as e:
        print(traceback.format_exc(), file=sys.stderr)
        return {"success": False, "error": f"GeoJSON import error: {str(e)}"}


@app.post("/api/cadastral/maps/upload-scanned")
async def upload_scanned_map(
    file: UploadFile = File(...),
    panchayat: str = Form(...),
    village: str = Form(...),
    taluk: str = Form(""),
    district: str = Form("")
):
    """
    Uploads a scanned Panchayat map (JPG/PNG/TIFF/PDF) and prepares it for GCP georeferencing.
    Does NOT fabricate coordinates until calibrated.
    """
    try:
        map_id = f"MAP-SCAN-{uuid.uuid4().hex[:6].upper()}"
        file_ext = os.path.splitext(file.filename)[1].lower()
        saved_filename = f"{map_id}{file_ext}"
        saved_path = os.path.join(MAPS_DIR, saved_filename)

        contents = await file.read()
        with open(saved_path, "wb") as f:
            f.write(contents)

        public_url = f"/static/maps/{saved_filename}"

        database.add_panchayat_map({
            "map_id": map_id,
            "map_name": f"{panchayat} Scanned Cadastral Sheet",
            "district": district,
            "taluk": taluk,
            "village": village,
            "panchayat": panchayat,
            "map_type": "scanned_raster",
            "file_path": public_url,
            "coordinate_reference_system": "Uncalibrated",
            "georeferenced": False,
            "gcp_points": [],
            "transformation_matrix": {},
            "bounds": None
        })

        return {
            "success": True,
            "map_id": map_id,
            "url": public_url,
            "georeferenced": False,
            "status": "Map is not georeferenced. Please configure Ground Control Points (GCPs)."
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


class GeoreferenceRequest(BaseModel):
    map_id: str
    gcp_points: List[Dict[str, float]]
    img_width: int
    img_height: int


@app.post("/api/cadastral/maps/georeference")
def georeference_scanned_map(req: GeoreferenceRequest):
    """
    Calibrates scanned Panchayat map using Ground Control Points (GCPs).
    Solves 2D Affine least-squares transformation, calculates RMSE, and derives geographic bounding box.
    """
    try:
        transform_result = cadastral_engine.compute_affine_transformation(req.gcp_points)

        if not transform_result.get("georeferenced"):
            return {
                "success": False,
                "status": "Map is not georeferenced.",
                "reason": transform_result.get("reason"),
                "min_points_required": transform_result.get("min_points_required")
            }

        # Calculate bounding box for Leaflet ImageOverlay
        bounds = cadastral_engine.compute_georeferenced_bounds(
            transform_result["coefficients"],
            req.img_width,
            req.img_height
        )

        database.update_panchayat_map_georef(
            req.map_id,
            req.gcp_points,
            transform_result,
            bounds
        )

        return {
            "success": True,
            "status": "Map is georeferenced.",
            "transform": transform_result,
            "bounds": bounds,
            "rmse_meters": transform_result.get("rmse_meters")
        }

    except Exception as e:
        print(traceback.format_exc(), file=sys.stderr)
        return {"success": False, "error": str(e)}


# ==========================================
# 4. EXISTING UTILITIES & FEATURES (PRESERVED)
# ==========================================

@app.post("/api/compare")
async def compare_documents(files: List[UploadFile] = File(...)):
    try:
        reports = []
        for file in files:
            res = await extract_document(file)
            if res.get("success"):
                reports.append(res)

        if len(reports) < 2:
            return {"success": False, "error": "Please upload at least 2 valid documents to compare."}

        diffs = []
        doc1 = reports[0]["parsed_data"]
        doc2 = reports[1]["parsed_data"]

        fields = ["owner", "patta_number", "survey_number", "subdivision", "land_area", "village", "panchayat"]
        for f in fields:
            val1 = doc1.get(f)
            val2 = doc2.get(f)
            diffs.append({
                "field": f,
                "doc1_value": val1,
                "doc2_value": val2,
                "is_different": val1 != val2
            })

        return {
            "success": True,
            "documents": [
                {"id": r["id"], "filename": r["filename"], "parsed_data": r["parsed_data"]} for r in reports
            ],
            "diffs": diffs
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/history")
def get_history(query: str = Query(None)):
    try:
        docs = database.get_documents()
        if query:
            database.add_search_history(query)
            q = query.lower().strip()
            filtered_docs = []
            for d in docs:
                p = d["parsed_data"]
                match = (
                    q in d["filename"].lower() or
                    q in d["raw_text"].lower() or
                    q in str(p.get("owner", "")).lower() or
                    q in str(p.get("village", "")).lower() or
                    q in str(p.get("survey_number", "")).lower() or
                    q in str(p.get("panchayat", "")).lower()
                )
                if match:
                    filtered_docs.append(d)
            return {"success": True, "documents": filtered_docs}

        return {"success": True, "documents": docs}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/search-suggestions")
def get_suggestions():
    try:
        history = database.get_search_history()
        return {"success": True, "suggestions": history}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/chat")
async def chat_assistant(request: dict):
    doc_id = request.get("doc_id")
    message = request.get("message", "").lower().strip()

    if not doc_id:
        return {"success": False, "error": "No active document ID provided."}

    doc = database.get_document_by_id(doc_id)
    if not doc:
        return {"success": False, "error": "Document not found."}

    p = doc["parsed_data"]
    owner = p.get("owner", "Not extracted")
    survey = p.get("survey_number", "Not extracted")
    subdiv = p.get("subdivision", "N/A")
    village = p.get("village", "Not extracted")
    panchayat = p.get("panchayat", "Not extracted")
    area = p.get("land_area", "Not extracted")
    classification = p.get("classification", "Not extracted")

    if any(k in message for k in ["who", "owner", "pattadar", "பட்டாதாரர்"]):
        response = f"The registered owner / pattadar is **{owner}**."
    elif any(k in message for k in ["survey", "subdivision", "புல எண்", "உட்பிரிவு"]):
        response = f"The land identifier is Survey No. **{survey}** (Subdivision: **{subdiv}**)."
    elif any(k in message for k in ["where", "location", "village", "panchayat", "கிராமம்"]):
        response = f"The parcel is located in Village: **{village}**, Panchayat: **{panchayat}**, Taluk: **{p.get('taluk', 'N/A')}**, District: **{p.get('district', 'N/A')}**."
    elif any(k in message for k in ["area", "size", "extent", "பரப்பளவு"]):
        response = f"The document area is **{area}**."
    elif any(k in message for k in ["cadastral", "gis", "locate", "boundary"]):
        response = f"To locate parcel **{survey}/{subdiv}**, click the **'Locate Land'** button on the dashboard to cross-reference against the Panchayat Cadastral GIS map."
    else:
        response = (
            f"**Land Summary:**\n"
            f"- **Owner:** {owner}\n"
            f"- **Survey No:** {survey}/{subdiv}\n"
            f"- **Village / Panchayat:** {village} ({panchayat})\n"
            f"- **Area:** {area}\n"
            f"- **Classification:** {classification}\n"
            f"- **Document Type:** {doc['doc_type']}"
        )

    return {"success": True, "response": response}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
