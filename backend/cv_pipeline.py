"""
CV & Preprocessing OCR Pipeline for LandLens AI
Supports Multilingual Document-to-Land-Intelligence:
- Multi-format ingestion: JPG, JPEG, PNG, WEBP, and PDF (via pypdfium2)
- Image quality validation (blur variance, resolution, brightness)
- Preprocessing: Deskewing, CLAHE contrast enhancement, Otsu & Adaptive binarization
- Document Layout Detection (Header, Patta Info, Administrative Block, Survey Table, Footer)
- Structured Table Extraction: Cell grid reconstruction preserving row relationships
- Multilingual OCR: Tamil, English, Hindi with bounding box tokens for visual evidence
- Base64 image export for visual evidence verification and debug mode
"""

import os
import sys
import base64
import logging
import cv2
import numpy as np
import pytesseract
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

import shutil

# Tesseract executable lookup paths on Windows
TESSERACT_CANDIDATES = [
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    os.path.expandvars(r'%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe'),
    os.path.expandvars(r'%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe')
]

# Set TESSDATA_PREFIX to local tessdata directory if available and not explicitly set
TESSDATA_DIR = os.getenv("TESSDATA_PREFIX", os.path.join(os.path.dirname(__file__), "tessdata"))
if os.path.exists(TESSDATA_DIR):
    os.environ["TESSDATA_PREFIX"] = TESSDATA_DIR

# Set tesseract command: prefer PATH/Linux system binary, then Windows candidates
tess_cmd = shutil.which("tesseract")
if tess_cmd:
    pytesseract.pytesseract.tesseract_cmd = tess_cmd
else:
    for cand in TESSERACT_CANDIDATES:
        if os.path.exists(cand):
            pytesseract.pytesseract.tesseract_cmd = cand
            break

# Lazy-loaded RapidOCR engine instance
_rapid_ocr_engine = None

def get_rapid_ocr():
    global _rapid_ocr_engine
    if _rapid_ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _rapid_ocr_engine = RapidOCR()
            logger.info("RapidOCR ONNX engine initialized.")
        except Exception as e:
            logger.warning(f"Could not initialize RapidOCR: {e}")
            _rapid_ocr_engine = False
    return _rapid_ocr_engine if _rapid_ocr_engine is not False else None


# ==========================================
# 1. DOCUMENT LOADING (IMAGES + PDF)
# ==========================================

def load_document_image(file_bytes: bytes, filename: str = "") -> np.ndarray:
    """
    Decodes uploaded file bytes into a standard BGR image array.
    Supports JPG, JPEG, PNG, WEBP, BMP, TIFF, and PDF.
    """
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    ext = os.path.splitext(filename.lower())[1]

    # Handle PDF documents
    if ext == ".pdf" or file_bytes[:4] == b"%PDF":
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(file_bytes)
            if len(pdf) == 0:
                raise ValueError("PDF document has 0 pages.")
            # Render first page at high quality (scale=2.5 ~ 180-200 DPI)
            page = pdf[0]
            pil_image = page.render(scale=2.5).to_pil()
            rgb_arr = np.array(pil_image)
            # Convert RGB to BGR for OpenCV
            if len(rgb_arr.shape) == 2:
                return cv2.cvtColor(rgb_arr, cv2.COLOR_GRAY2BGR)
            return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Failed to render PDF: {e}")
            raise ValueError(f"Could not render PDF document: {str(e)}")

    # Handle Standard Image formats
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image format. Supported: JPG, JPEG, PNG, WEBP, PDF.")

    return image


# ==========================================
# 2. IMAGE QUALITY CHECK
# ==========================================

def analyze_image_quality(image: np.ndarray) -> Dict[str, Any]:
    """
    Validates document quality:
    - Laplacian variance for blur detection
    - Resolution check
    - Brightness and contrast check
    - Readability check
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        return {
            "blur_variance": 0.0,
            "average_brightness": 0.0,
            "width": 0,
            "height": 0,
            "is_blurry": True,
            "is_unusable": True,
            "is_dark": False,
            "is_overexposed": False,
            "is_low_resolution": True,
            "quality_score": 0,
            "warnings": ["Failed to load image for quality check."],
            "message": "Document quality is too low for reliable extraction."
        }

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    height, width = gray.shape

    # 1. Laplacian variance for blur
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # 2. Brightness
    brightness = float(np.mean(gray))

    warnings = []
    # If blur variance is below 35, the document cannot be read reliably
    is_unusable = lap_var < 35.0 or width < 400 or height < 400
    is_blurry = lap_var < 55.0

    if is_unusable:
        warnings.append("Document quality is too low for reliable extraction.")
    elif is_blurry:
        warnings.append(f"Image is potentially blurry (variance: {lap_var:.1f}). OCR accuracy may be affected.")

    is_dark = brightness < 45.0
    if is_dark:
        warnings.append(f"Image is too dark (average brightness: {brightness:.1f}).")

    is_overexposed = brightness > 240.0
    if is_overexposed:
        warnings.append("Image is overexposed/too bright. Some details might be washed out.")

    is_low_resolution = width < 800 or height < 800
    if is_low_resolution:
        warnings.append(f"Low resolution image ({width}x{height}). Recommended resolution is 1200px or higher.")

    # Quality score computation (0-100)
    score = 100
    if is_unusable:
        score = min(score, 30)
    if is_blurry:
        score -= 25
    if is_dark or is_overexposed:
        score -= 15
    if is_low_resolution:
        score -= 15
    score = max(10, min(100, score))

    msg = "Document quality is sufficient for OCR."
    if is_unusable:
        msg = "Document quality is too low for reliable extraction."
    elif warnings:
        msg = warnings[0]

    return {
        "blur_variance": round(lap_var, 2),
        "average_brightness": round(brightness, 2),
        "width": int(width),
        "height": int(height),
        "is_blurry": bool(is_blurry),
        "is_unusable": bool(is_unusable),
        "is_dark": bool(is_dark),
        "is_overexposed": bool(is_overexposed),
        "is_low_resolution": bool(is_low_resolution),
        "quality_score": int(score),
        "warnings": warnings,
        "message": msg
    }


# ==========================================
# 3. PREPROCESSING PIPELINE
# ==========================================

def deskew_image(image: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Detects document orientation angle using threshold contour analysis
    and deskews the image.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) == 0:
        return image, 0.0

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > 0.5 and abs(angle) < 45.0:
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated, float(angle)

    return image, 0.0


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    preserving subtle Tamil, Hindi, and English character strokes.
    """
    if len(image.shape) == 3:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        enhanced = cv2.merge((cl, a, b))
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    else:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(image)


def preprocess_image_pipeline(image: np.ndarray) -> Dict[str, Any]:
    """
    Full OpenCV preprocessing pipeline:
    - Deskewing
    - CLAHE contrast enhancement
    - Grayscale conversion
    - Noise suppression
    - Otsu & Adaptive binarization
    """
    # 1. Deskew
    deskewed, rot_angle = deskew_image(image)

    # 2. Contrast Enhancement
    enhanced = enhance_contrast(deskewed)

    # 3. Grayscale
    gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY) if len(enhanced.shape) == 3 else enhanced

    # 4. Mild Gaussian filtering to eliminate scan speckle noise
    denoised = cv2.GaussianBlur(gray, (3, 3), 0)

    # 5. Otsu thresholding
    _, thresh_otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 6. Adaptive thresholding for uneven lighting
    thresh_adaptive = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 11
    )

    # Combine Otsu and Adaptive to preserve both dense text and faint table lines
    combined_thresh = cv2.bitwise_or(thresh_otsu, thresh_adaptive)

    return {
        "processed_image": enhanced,
        "gray": denoised,
        "thresh": combined_thresh,
        "rotation_angle": rot_angle
    }


# ==========================================
# 4. DOCUMENT LAYOUT DETECTION
# ==========================================

def detect_document_layout(image: np.ndarray, thresh: np.ndarray) -> List[Dict[str, Any]]:
    """
    Identifies high-level document regions using contour bounding geometry:
    - Header
    - Patta / Document Details
    - Administrative Area
    - Survey Table
    - Footer / Seal
    """
    h, w = thresh.shape[:2]
    regions = []

    # 1. Header Region (Top 0% - 22% of page)
    regions.append({
        "name": "Header",
        "label": "Government & Department Header",
        "box": {"x": 0, "y": 0, "width": w, "height": int(h * 0.22)}
    })

    # 2. Document & Patta Information (22% - 38%)
    regions.append({
        "name": "Patta Information",
        "label": "Patta No. & Ownership Details",
        "box": {"x": 0, "y": int(h * 0.22), "width": w, "height": int(h * 0.16)}
    })

    # 3. Administrative Information (38% - 50%)
    regions.append({
        "name": "Administrative Location",
        "label": "District, Taluk, Village, Panchayat",
        "box": {"x": 0, "y": int(h * 0.38), "width": w, "height": int(h * 0.12)}
    })

    # 4. Survey Table Region - Search for large central rectangular contours
    # Find table using line morphology
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (int(w * 0.1), 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, int(h * 0.05)))
    det_h = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    det_v = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    t_mask = cv2.addWeighted(det_h, 0.5, det_v, 0.5, 0.0)
    _, t_mask = cv2.threshold(t_mask, 40, 255, cv2.THRESH_BINARY)
    t_mask = cv2.dilate(t_mask, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)), iterations=2)

    contours, _ = cv2.findContours(t_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    found_table = False
    for c in contours:
        bx, by, bw, bh = cv2.boundingRect(c)
        if bw > w * 0.35 and bh > h * 0.10:
            regions.append({
                "name": "Survey Table",
                "label": "Cadastral Survey & Subdivision Table",
                "box": {"x": int(bx), "y": int(by), "width": int(bw), "height": int(bh)}
            })
            found_table = True
            break

    if not found_table:
        # Default middle region for table
        regions.append({
            "name": "Survey Table",
            "label": "Cadastral Survey & Subdivision Table",
            "box": {"x": int(w * 0.05), "y": int(h * 0.50), "width": int(w * 0.90), "height": int(h * 0.28)}
        })

    # 5. Footer & Seal (Bottom 78% - 100%)
    regions.append({
        "name": "Footer & Seal",
        "label": "Signatures, Verification Seals, & Total Area",
        "box": {"x": 0, "y": int(h * 0.78), "width": w, "height": int(h * 0.22)}
    })

    return regions


# ==========================================
# 5. TABLE DETECTION & CELL RECONSTRUCTION
# ==========================================

def extract_tables(
    image: np.ndarray,
    thresh: np.ndarray,
    lang: str = "tam+eng"
) -> Dict[str, Any]:
    """
    Detects table grid lines, segments rows and columns, and extracts
    individual cells while maintaining strict row-column relationships.
    Never joins rows into an unordered text stream.
    """
    h, w = thresh.shape[:2]

    # Horizontal and vertical structuring elements
    line_min_w = max(30, int(w * 0.06))
    line_min_h = max(25, int(h * 0.03))

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (line_min_w, 1))
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, line_min_h))

    h_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, h_kernel, iterations=2)
    v_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, v_kernel, iterations=2)

    table_grid = cv2.add(h_lines, v_lines)
    table_grid = cv2.dilate(table_grid, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)), iterations=2)

    contours, _ = cv2.findContours(table_grid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[1])

    detected_tables = []
    cells_with_boxes = []

    rapid = get_rapid_ocr()

    for c in contours:
        tx, ty, tw, th = cv2.boundingRect(c)
        if tw < w * 0.3 or th < 70:
            continue

        table_roi = image[ty:ty+th, tx:tx+tw]
        roi_thresh = thresh[ty:ty+th, tx:tx+tw]

        # Extract cell masks
        c_hor = cv2.morphologyEx(roi_thresh, cv2.MORPH_OPEN, h_kernel, iterations=1)
        c_ver = cv2.morphologyEx(roi_thresh, cv2.MORPH_OPEN, v_kernel, iterations=1)
        c_lines = cv2.add(c_hor, c_ver)
        c_mask = cv2.bitwise_not(c_lines)

        cell_contours, _ = cv2.findContours(c_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        cells = []
        for cc in cell_contours:
            cx, cy, cw, ch = cv2.boundingRect(cc)
            if 25 < cw < tw * 0.95 and 18 < ch < th * 0.95:
                cells.append((cx, cy, cw, ch))

        if not cells:
            continue

        # Sort cells top-to-bottom then left-to-right
        cells = sorted(cells, key=lambda i: (i[1], i[0]))

        # Group into rows
        rows = []
        curr_row = []
        curr_y = -1
        y_tolerance = 16

        for cx, cy, cw, ch in cells:
            if curr_y == -1 or abs(cy - curr_y) < y_tolerance:
                curr_row.append((cx, cy, cw, ch))
                if curr_y == -1:
                    curr_y = cy
            else:
                curr_row = sorted(curr_row, key=lambda i: i[0])
                rows.append(curr_row)
                curr_row = [(cx, cy, cw, ch)]
                curr_y = cy

        if curr_row:
            curr_row = sorted(curr_row, key=lambda i: i[0])
            rows.append(curr_row)

        # OCR individual row cells
        table_rows_text = []
        for r_idx, row in enumerate(rows):
            row_texts = []
            for c_idx, (cx, cy, cw, ch) in enumerate(row):
                # Global absolute coordinates
                abs_x = tx + cx
                abs_y = ty + cy

                # Crop cell with safety padding
                pad = 2
                cy1 = max(0, cy - pad)
                cy2 = min(th, cy + ch + pad)
                cx1 = max(0, cx - pad)
                cx2 = min(tw, cx + cw + pad)
                cell_img = table_roi[cy1:cy2, cx1:cx2]

                cell_text = ""
                cell_conf = 0.0

                # OCR with RapidOCR or Tesseract
                if rapid:
                    try:
                        res, _ = rapid(cell_img)
                        if res:
                            cell_text = " ".join([item[1] for item in res]).strip()
                            cell_conf = float(np.mean([item[2] for item in res]) * 100.0)
                    except Exception:
                        cell_text = ""

                if not cell_text:
                    try:
                        tess_cfg = '--psm 6'
                        cell_text = pytesseract.image_to_string(cell_img, lang=lang, config=tess_cfg).strip()
                        cell_conf = 85.0 if cell_text else 0.0
                    except Exception:
                        pass

                row_texts.append(cell_text)

                if cell_text:
                    cells_with_boxes.append({
                        "text": cell_text,
                        "confidence": round(cell_conf, 1),
                        "row": r_idx,
                        "col": c_idx,
                        "box": {
                            "x": int(abs_x),
                            "y": int(abs_y),
                            "width": int(cw),
                            "height": int(ch)
                        }
                    })

            if any(t.strip() for t in row_texts):
                table_rows_text.append(row_texts)

        if table_rows_text:
            detected_tables.append({
                "rows": table_rows_text,
                "box": {"x": int(tx), "y": int(ty), "width": int(tw), "height": int(th)}
            })

    return {
        "tables": [t["rows"] for t in detected_tables],
        "table_structures": detected_tables,
        "cells": cells_with_boxes
    }


# ==========================================
# 6. MULTILINGUAL OCR WITH BOUNDING BOXES
# ==========================================

def run_multilingual_ocr(
    image: np.ndarray,
    lang: str = "tam+eng"
) -> Dict[str, Any]:
    """
    Executes multilingual OCR returning:
    - raw_text: full page text
    - ocr_tokens: individual word/text bounding boxes with confidence
    - average_confidence: overall OCR confidence score
    """
    tokens = []
    lines_text = []

    # Map language codes
    rapid = get_rapid_ocr()
    ocr_success = False

    # Attempt 1: RapidOCR (Fast, accurate on Asian scripts, returns exact coordinates)
    if rapid:
        try:
            res, _ = rapid(image)
            if res:
                for line_idx, item in enumerate(res):
                    pts, txt, conf = item
                    txt_clean = txt.strip()
                    if not txt_clean:
                        continue

                    # Compute bounding box from vertices
                    xs = [pt[0] for pt in pts]
                    ys = [pt[1] for pt in pts]
                    bx = int(min(xs))
                    by = int(min(ys))
                    bw = int(max(xs) - min(xs))
                    bh = int(max(ys) - min(ys))

                    conf_pct = round(float(conf) * 100.0, 1)

                    tokens.append({
                        "text": txt_clean,
                        "confidence": conf_pct,
                        "x": bx,
                        "y": by,
                        "width": bw,
                        "height": bh,
                        "line_no": line_idx + 1
                    })
                    lines_text.append(txt_clean)

                if lines_text:
                    ocr_success = True
        except Exception as e:
            logger.warning(f"RapidOCR execution note: {e}")

    # Attempt 2: PyTesseract (with tam+eng, hin+eng, or eng)
    if not ocr_success:
        try:
            # Map selected language for Tesseract
            tess_lang = "tam+eng"
            if "hin" in lang:
                tess_lang = "hin+eng"
            elif lang == "eng":
                tess_lang = "eng"
            elif "tam" in lang:
                tess_lang = "tam+eng"

            data = pytesseract.image_to_data(image, lang=tess_lang, output_type=pytesseract.Output.DICT)
            n_boxes = len(data['text'])

            for i in range(n_boxes):
                t = data['text'][i].strip()
                c = float(data['conf'][i])
                if t and c > 0:
                    tokens.append({
                        "text": t,
                        "confidence": round(c, 1),
                        "x": int(data['left'][i]),
                        "y": int(data['top'][i]),
                        "width": int(data['width'][i]),
                        "height": int(data['height'][i]),
                        "line_no": int(data['line_num'][i])
                    })

            full_str = pytesseract.image_to_string(image, lang=tess_lang)
            lines_text = [l.strip() for l in full_str.split("\n") if l.strip()]
            ocr_success = True
        except Exception as e:
            logger.error(f"Tesseract OCR execution error: {e}")

    raw_text = "\n".join(lines_text) if lines_text else ""
    avg_conf = float(np.mean([t["confidence"] for t in tokens])) if tokens else 0.0

    return {
        "raw_text": raw_text,
        "tokens": tokens,
        "average_confidence": round(avg_conf, 1)
    }


# ==========================================
# 7. BASE64 ENCODING FOR EVIDENCE VIEWER
# ==========================================

def encode_image_to_base64(image: np.ndarray, max_dim: int = 1400) -> str:
    """Encodes image as JPEG Base64 Data URL for frontend evidence display."""
    if image is None or image.size == 0:
        return ""
    h, w = image.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        resized = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        resized = image

    _, buffer = cv2.imencode('.jpg', resized, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_str}"


# ==========================================
# 8. MASTER PIPELINE INTEGRATION
# ==========================================

def process_document_pipeline(
    file_bytes: bytes,
    filename: str = "",
    lang: str = "tam+eng"
) -> Dict[str, Any]:
    """
    Main entry point for document processing:
    1. Load image (PDF or Image)
    2. Quality check
    3. Preprocessing (deskew, contrast enhance, threshold)
    4. Layout detection
    5. Table extraction
    6. Multilingual OCR with token coordinates
    7. Generate base64 images for Evidence Viewer & Debug Mode
    """
    # 1. Load Image
    image = load_document_image(file_bytes, filename)

    # 2. Quality Check
    quality = analyze_image_quality(image)
    if quality["is_unusable"]:
        return {
            "success": False,
            "error": "Document quality is too low for reliable extraction.",
            "quality_report": quality,
            "raw_text": "",
            "tokens": [],
            "tables": [],
            "layout_regions": [],
            "original_image_base64": encode_image_to_base64(image),
            "processed_image_base64": ""
        }

    # 3. Preprocessing
    preprocessed = preprocess_image_pipeline(image)
    proc_img = preprocessed["processed_image"]
    thresh = preprocessed["thresh"]

    # 4. Layout Detection
    layout_regions = detect_document_layout(proc_img, thresh)

    # 5. Table Detection & Extraction
    table_result = extract_tables(proc_img, thresh, lang=lang)

    # 6. Multilingual OCR with token bounding boxes
    ocr_result = run_multilingual_ocr(proc_img, lang=lang)

    # 7. Visual Images
    orig_b64 = encode_image_to_base64(image)
    proc_b64 = encode_image_to_base64(proc_img)

    return {
        "success": True,
        "quality_report": quality,
        "raw_text": ocr_result["raw_text"],
        "tokens": ocr_result["tokens"],
        "average_confidence": ocr_result["average_confidence"],
        "tables": table_result["tables"],
        "table_structures": table_result["table_structures"],
        "table_cells": table_result["cells"],
        "layout_regions": layout_regions,
        "rotation_angle": preprocessed["rotation_angle"],
        "original_image_base64": orig_b64,
        "processed_image_base64": proc_b64,
        "image_width": int(image.shape[1]),
        "image_height": int(image.shape[0])
    }


# Backward-compatible convenience functions
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    return load_document_image(image_bytes)

def extract_tables_and_text(image: np.ndarray, lang: str = "tam+eng") -> Dict[str, Any]:
    pre = preprocess_image_pipeline(image)
    tables = extract_tables(pre["processed_image"], pre["thresh"], lang=lang)
    ocr = run_multilingual_ocr(pre["processed_image"], lang=lang)
    return {"raw_text": ocr["raw_text"], "tables": tables["tables"]}

