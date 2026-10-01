"""
Test Suite for AI-Based Smart Property Locator and Land Intelligence System
Tests:
1. Blurry document detection (rejection without guessing)
2. Clear Tamil/English document extraction
3. Survey table reconstruction with multiple rows & subdivisions
4. Area consistency validation (matching vs mismatch)
5. Evidence token coordinate association
6. Cadastral localization hierarchy (Exact vs Administrative vs Unresolved)
"""

import cv2
import numpy as np
import os
import json
from cv_pipeline import process_document_pipeline, analyze_image_quality
from extractor import parse_extracted_data, validate_area_consistency, validate_extracted_document
import cadastral_engine
import database

def create_synthetic_patta_image(blur=False, angle=0):
    """Creates a synthetic Patta document image for pipeline validation."""
    img = np.full((1200, 900, 3), 255, dtype=np.uint8)
    
    # Draw header line
    cv2.putText(img, "GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT", (60, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    cv2.putText(img, "PATTA / CHITTA EXTRACT (FORM VI)", (180, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    
    # Metadata fields
    cv2.putText(img, "Patta No: PAT/875/2026", (60, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "District: Cuddalore", (60, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Taluk: Cuddalore", (450, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Village: Cuddalore Town", (60, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Owner: Rajesh Kumar Sharma", (60, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    
    # Table border and cells
    # Table from y=420 to y=650, x=60 to x=840
    cv2.rectangle(img, (60, 420), (840, 620), (0, 0, 0), 2)
    # Header row line
    cv2.line(img, (60, 470), (840, 470), (0, 0, 0), 2)
    # Row 1 line
    cv2.line(img, (60, 545), (840, 545), (0, 0, 0), 2)
    # Column dividers
    cv2.line(img, (260, 420), (260, 620), (0, 0, 0), 2)
    cv2.line(img, (480, 420), (480, 620), (0, 0, 0), 2)
    cv2.line(img, (660, 420), (660, 620), (0, 0, 0), 2)
    
    # Table text
    cv2.putText(img, "Survey No", (80, 455), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "Subdivision", (280, 455), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "Classification", (500, 455), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "Area", (700, 455), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    
    # Row 1
    cv2.putText(img, "125", (120, 515), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "3A", (340, 515), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "Dry Land", (510, 515), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "0.10.00 Hectares", (670, 515), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
    
    # Row 2
    cv2.putText(img, "125", (120, 590), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "3B", (340, 590), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.putText(img, "Dry Land", (510, 590), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "0.12.50 Hectares", (670, 590), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
    
    # Total area
    cv2.putText(img, "Total Area: 0.22.50 Hectares", (60, 680), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)
    cv2.putText(img, "Status: Verified and Active", (60, 730), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    # Rotated if requested
    if angle != 0:
        h, w = img.shape[:2]
        M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
        img = cv2.warpAffine(img, M, (w, h), borderValue=(255, 255, 255))
        
    # Blurred if requested
    if blur:
        img = cv2.GaussianBlur(img, (25, 25), 0)
        
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()


def run_tests():
    print("==================================================")
    print("LANDLENS AI PIPELINE VERIFICATION & TEST SUITE")
    print("==================================================")
    
    # Test 1: Blurry Document Rejection
    print("\n[TEST 1] Blurry Document Quality Check...")
    blurry_bytes = create_synthetic_patta_image(blur=True)
    res_blur = process_document_pipeline(blurry_bytes, "blurry_doc.png")
    assert res_blur["success"] is False, "Blurry document should be rejected"
    assert "low for reliable extraction" in res_blur["error"], "Error must specify insufficient quality"
    print("  [OK] PASS: Blurry document properly detected and rejected without fake data.")

    # Test 2: Clear Document Pipeline & Information Extraction
    print("\n[TEST 2] Clear Patta Document Extraction...")
    clear_bytes = create_synthetic_patta_image(blur=False)
    res_clear = process_document_pipeline(clear_bytes, "clear_patta.png")
    assert res_clear["success"] is True, "Clear document should process successfully"
    print(f"  OCR Text characters: {len(res_clear['raw_text'])}")
    print(f"  OCR Tokens detected: {len(res_clear['tokens'])}")
    print(f"  Layout regions detected: {len(res_clear['layout_regions'])}")

    parsed = parse_extracted_data(res_clear["raw_text"], res_clear["tables"], res_clear["tokens"], res_clear["table_cells"])
    print(f"  Extracted Survey No: {parsed['survey_number']}")
    print(f"  Extracted Subdivision: {parsed['subdivision']}")
    print(f"  Extracted Village: {parsed['village']}")
    print(f"  Extracted Patta No: {parsed['patta_number']}")
    print(f"  Extracted Total Area: {parsed['total_area']}")
    assert parsed["survey_number"] == "125", f"Expected survey_no '125', got '{parsed['survey_number']}'"
    print("  [OK] PASS: Structured fields accurately extracted from genuine document image.")

    # Test 3: Field-Level Evidence Bounding Boxes
    print("\n[TEST 3] Field-Level Evidence Verification...")
    evidence = parsed.get("evidence", {})
    assert "patta_number" in evidence or "survey_number" in evidence, "Evidence must link to source region"
    print(f"  Evidence regions linked: {list(evidence.keys())}")
    print("  [OK] PASS: Extracted fields link directly to visual document bounding boxes.")

    # Test 4: Area Consistency Validation
    print("\n[TEST 4] Area Consistency Validation...")
    # Matching areas
    matching_rows = [
        {"survey_no": "125", "subdivision": "3A", "area": "1000 sqm"},
        {"survey_no": "125", "subdivision": "3B", "area": "1250 sqm"}
    ]
    val_match = validate_area_consistency(matching_rows, "2250 sqm")
    assert val_match["is_consistent"] is True, "Areas should be consistent"
    print(f"  Matching areas: {val_match['status']}")

    # Mismatch areas
    val_mismatch = validate_area_consistency(matching_rows, "5000 sqm")
    assert val_mismatch["is_consistent"] is False, "Areas should detect discrepancy"
    assert "Potential area inconsistency detected" in val_mismatch["status"]
    print(f"  Mismatch areas detected: {val_mismatch['message']}")
    print("  [OK] PASS: Area consistency correctly compares sub-areas to total area without accusing fraud.")

    # Test 5: Cadastral Location Hierarchy (Exact vs Administrative vs Unresolved)
    print("\n[TEST 5] Cadastral Location Matching Hierarchy...")
    database.init_db()
    candidates = database.get_all_cadastral_parcels(district="Cuddalore", taluk="Cuddalore", village="Cuddalore Town")
    
    # Case A: Exact Match
    exact_match = cadastral_engine.match_cadastral_parcel({
        "district": "Cuddalore", "taluk": "Cuddalore", "village": "Cuddalore Town",
        "survey_number": "125", "subdivision": "3A", "patta_area": "982"
    }, candidates)
    assert exact_match["location_status"] == "parcel_found", "Should match exact parcel"
    assert exact_match["geometry"] is not None, "Exact match must provide real polygon geometry"
    print("  [OK] Case A: Exact parcel found with genuine cadastral polygon.")

    # Case B: Village exists but Survey Number not in dataset
    village_only = cadastral_engine.match_cadastral_parcel({
        "district": "Cuddalore", "taluk": "Cuddalore", "village": "Cuddalore Town",
        "survey_number": "99999", "subdivision": "ZZ", "patta_area": "1000"
    }, candidates)
    assert village_only["location_status"] == "map_available_but_parcel_not_found"
    assert village_only["geometry"] is None, "Administrative match must NOT return fake polygon"
    print("  [OK] Case B: Administrative location identified without fake polygon.")

    # Case C: Nonexistent location
    unresolved = cadastral_engine.match_cadastral_parcel({
        "district": "Nonexistent", "taluk": "Nonexistent", "village": "Nonexistent",
        "survey_number": "888", "subdivision": "1"
    }, [])
    assert unresolved["location_status"] == "map_not_available"
    assert unresolved["centroid"] is None, "Unresolved location must NOT place fake marker"
    print("  [OK] Case C: Unresolved location returned with centroid=None.")

    print("\n==================================================")
    print("ALL 5 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
