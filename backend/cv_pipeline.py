import cv2
import numpy as np
import pytesseract
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check default Windows installation path, otherwise fall back to system PATH
default_tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(default_tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = default_tesseract_path
os.environ["TESSDATA_PREFIX"] = os.path.join(os.path.dirname(__file__), "tessdata")

def analyze_image_quality(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return {
            "blur_variance": 0.0,
            "average_brightness": 0.0,
            "width": 0,
            "height": 0,
            "is_blurry": False,
            "is_dark": False,
            "is_overexposed": False,
            "is_low_resolution": True,
            "warnings": ["Failed to decode image."]
        }
    
    height, width = image.shape
    
    # Calculate Laplacian variance for blur
    lap_var = cv2.Laplacian(image, cv2.CV_64F).var()
    
    # Calculate mean brightness
    brightness = np.mean(image)
    
    warnings = []
    is_blurry = lap_var < 60
    if is_blurry:
        warnings.append(f"Image is potentially blurry (variance: {lap_var:.1f}). OCR accuracy may be affected.")
        
    is_dark = brightness < 45
    if is_dark:
        warnings.append(f"Image is too dark (average brightness: {brightness:.1f}). Recommend uploading a clearer scan.")
        
    is_overexposed = brightness > 240
    if is_overexposed:
        warnings.append("Image is overexposed/too bright. Some details might be washed out.")
        
    is_low_resolution = width < 800 or height < 800
    if is_low_resolution:
        warnings.append(f"Low resolution image ({width}x{height}). Recommended resolution is 1200px or higher.")
        
    return {
        "blur_variance": float(lap_var),
        "average_brightness": float(brightness),
        "width": int(width),
        "height": int(height),
        "is_blurry": bool(is_blurry),
        "is_dark": bool(is_dark),
        "is_overexposed": bool(is_overexposed),
        "is_low_resolution": bool(is_low_resolution),
        "warnings": warnings
    }

def deskew_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Thresholding
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    
    # Grab coordinates of all non-zero pixels
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) == 0:
        return image, 0.0
        
    angle = cv2.minAreaRect(coords)[-1]
    
    # Adjust rotation angle
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate if angle is significant
    if abs(angle) > 0.5 and abs(angle) < 45:
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        logger.info(f"Deskewing: rotated document by {angle:.2f} degrees")
        return rotated, float(angle)
        
    return image, 0.0

def preprocess_image(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image bytes.")
    
    # Automatically deskew
    rotated_image, angle = deskew_image(image)
    return rotated_image

def extract_tables_and_text(image):
    logger.info("Starting CV Pipeline for Table Extraction...")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Thresholding
    # Use Otsu's thresholding for better binarization
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 2. Detect Lines
    # Horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # Vertical lines
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    detect_vertical = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    
    # Combine horizontal and vertical to find table outlines
    table_mask = cv2.addWeighted(detect_horizontal, 0.5, detect_vertical, 0.5, 0.0)
    _, table_mask = cv2.threshold(table_mask, 50, 255, cv2.THRESH_BINARY)
    
    # Dilate slightly to connect broken lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    table_mask = cv2.dilate(table_mask, kernel, iterations=2)
    
    # 3. Find Contours (potential tables)
    contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours from top to bottom
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[1])
    
    table_data = []
    
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        # Filter out random small boxes, assume table is relatively large
        if w > 200 and h > 100:
            logger.info(f"Detected table boundary at: x={x}, y={y}, w={w}, h={h}")
            table_roi = image[y:y+h, x:x+w]
            cell_thresh = thresh[y:y+h, x:x+w]
            
            # Detect cells inside the table crop
            c_hor = cv2.morphologyEx(cell_thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=1)
            c_ver = cv2.morphologyEx(cell_thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=1)
            
            c_mask = cv2.add(c_hor, c_ver)
            c_mask = cv2.dilate(c_mask, kernel, iterations=2)
            c_mask = cv2.bitwise_not(c_mask) # Cells become white, lines black
            
            cell_contours, _ = cv2.findContours(c_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            cells = []
            for cc in cell_contours:
                cx, cy, cw, ch = cv2.boundingRect(cc)
                # Filter reasonable cell sizes
                if 20 < cw < w * 0.95 and 15 < ch < h * 0.95:
                    cells.append((cx, cy, cw, ch))
            
            # Group cells into rows
            cells = sorted(cells, key=lambda i: (i[1], i[0]))
            
            row_data = []
            current_row = []
            current_y = -1
            
            for cx, cy, cw, ch in cells:
                if current_y == -1 or abs(cy - current_y) < 15: # Same row grouping tolerance
                    current_row.append((cx, cy, cw, ch))
                    if current_y == -1: current_y = cy
                else:
                    # OCR the current row
                    current_row = sorted(current_row, key=lambda i: i[0])
                    row_texts = []
                    for mx, my, mw, mh in current_row:
                        # Add some padding
                        mx_pad, my_pad = max(0, mx-2), max(0, my-2)
                        mw_pad, mh_pad = mw+4, mh+4
                        
                        cell_img = table_roi[my_pad:my_pad+mh_pad, mx_pad:mx_pad+mw_pad]
                        text = pytesseract.image_to_string(cell_img, lang='tam+eng', config='--psm 6').strip()
                        row_texts.append(text)
                    if any(row_texts): # Only keep non-empty rows
                        row_data.append(row_texts)
                        
                    current_row = [(cx, cy, cw, ch)]
                    current_y = cy
            
            # Last row
            if current_row:
                current_row = sorted(current_row, key=lambda i: i[0])
                row_texts = []
                for mx, my, mw, mh in current_row:
                    mx_pad, my_pad = max(0, mx-2), max(0, my-2)
                    mw_pad, mh_pad = mw+4, mh+4
                    cell_img = table_roi[my_pad:my_pad+mh_pad, mx_pad:mx_pad+mw_pad]
                    text = pytesseract.image_to_string(cell_img, lang='tam+eng', config='--psm 6').strip()
                    row_texts.append(text)
                if any(row_texts):
                    row_data.append(row_texts)
            
            if row_data:
                table_data.append(row_data)

    logger.info("Performing full page OCR fallback...")
    full_text = pytesseract.image_to_string(image, lang='tam+eng')

    return {
        "raw_text": full_text,
        "tables": table_data
    }
