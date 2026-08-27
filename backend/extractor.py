import re

def parse_extracted_data(text, tables):
    result = {
        "patta_number": None,
        "owner": None,
        "survey_number": None,
        "subdivision": None,
        "village": None,
        "taluk": None,
        "district": None,
        "land_area": None,
        "classification": "Residential",  # Default classification
        "document_type": "Sale Deed",      # Default doc type
        "survey_details": []
    }

    # Extract Patta Number
    patta_patterns = [
        r'(?:Patta\s*No|Patta\s*Number|Patta)[:\s]*([\w\d\/\-]+)',
        r'(?:பட்டா\s*எண்|பட்டா)[:\s]*([\w\d\/\-]+)',
    ]
    for pat in patta_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['patta_number'] = m.group(1).strip()
            break

    # Extract District
    district_patterns = [
        r'(?:District)[:\s]*([A-Za-z\s]+?)(?:\n|,\s*(?:Taluk|State))',
        r'(?:மாவட்டம்)[:\s]*([^\n,]+)',
    ]
    for pat in district_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['district'] = m.group(1).strip()
            break

    # Extract Taluk
    taluk_patterns = [
        r'(?:Taluk|Taluka)[:\s]*([A-Za-z\s]+?)(?:\n|,\s*(?:District|Village|State))',
        r'(?:வட்டம்)[:\s]*([^\n,]+)',
    ]
    for pat in taluk_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['taluk'] = m.group(1).strip()
            break

    # Extract Village
    village_patterns = [
        r'(?:Village)[:\s]*([A-Za-z\s]+?)(?:\n|,\s*(?:Taluk|District|State))',
        r'(?:கிராமம்)[:\s]*([^\n,]+)',
    ]
    for pat in village_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['village'] = m.group(1).strip()
            break

    # Extract Classification
    class_patterns = [
        r'(?:Classification|Land\s*Classification)[:\s]*([A-Za-z\s()]+)',
        r'(?:வகைப்பாடு|நில\s*வகை)[:\s]*([^\n,]+)',
    ]
    for pat in class_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['classification'] = m.group(1).strip()
            break
    
    # Keyword checks for classification if regex failed
    text_lower = text.toLowerCase() if hasattr(text, 'toLowerCase') else text.lower()
    if any(k in text_lower for k in ["dry land", "wet land", "agricultural", "agri", "farming", "நஞ்சை", "புஞ்சை", "நன்செய்", "புன்செய்"]):
        result['classification'] = "Agricultural"
    elif any(k in text_lower for k in ["commercial", "shop", "office", "industrial"]):
        result['classification'] = "Commercial"
    elif any(k in text_lower for k in ["residential", "plot", "house", "flat", "மனை"]):
        result['classification'] = "Residential"

    # Extract Document Type
    if any(k in text_lower for k in ["sale deed", "deed of sale", "கிரயப் பத்திரம்", "பத்திரம்"]):
        result['document_type'] = "Sale Deed"
    elif any(k in text_lower for k in ["7/12", "satbara", "ஏழு பன்னிரண்டு"]):
        result['document_type'] = "7/12 Extract"
    elif any(k in text_lower for k in ["mutation", "பட்டா மாற்றம்", "மாறுதல்"]):
        result['document_type'] = "Mutation Entry"
    elif any(k in text_lower for k in ["patta", "chitta", "பட்டா", "சிட்டா"]):
        result['document_type'] = "Patta/Chitta Extract"

    # Extract Area from Global
    area_patterns = [
        r'(?:Area|Extent|Total\s*Area)[:\s]*([\d.,]+\s*(?:acres?|cents?|sq\.?\s*ft\.?|hectares?|guntas?|ares?|ஹெக்|ஏக்கர்))',
        r'(?:பரப்பளவு|நிலப்பரப்பு)[:\s]*([\d.,]+\s*(?:ஏக்கர்|சென்ட்|சதுர\s*அடி|ஹெக்டேர்|எக்டேர்|ஹெக்))',
    ]
    for pat in area_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['land_area'] = m.group(1).strip()
            break

    # Look for owner
    owner_patterns = [
        r'(?:Owner\s*(?:Name)?|Buyer|Pattadar|Pattadhar|Name\s*of\s*(?:the\s*)?owner)[:\s]*([A-Za-z\s.\-]+)',
        r'(?:உரிமையாளர்|பட்டாதாரர்\s*பெயர்|பெயர்|பட்டாதாரர்)[:\s]*([^\n,]+)',
    ]
    for pat in owner_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result['owner'] = m.group(1).strip()
            break
            
    # Process Tables
    for table in tables:
        if len(table) < 2:
            continue
            
        headers = table[0]
        col_survey = -1
        col_subdiv = -1
        col_area = -1
        
        for i, h in enumerate(headers):
            h_lower = h.lower()
            if 'survey' in h_lower or 'புல' in h_lower or 'சர்வே' in h_lower or 'no' in h_lower:
                col_survey = i
            elif 'sub' in h_lower or 'உட்பிரிவு' in h_lower or 'பிரிவு' in h_lower:
                col_subdiv = i
            elif 'area' in h_lower or 'extent' in h_lower or 'பரப்' in h_lower or 'ஹெக்டேர்' in h_lower:
                col_area = i
                
        for row in table[1:]:
            s_no = row[col_survey] if 0 <= col_survey < len(row) else (row[0] if len(row)>0 else "")
            subdiv = row[col_subdiv] if 0 <= col_subdiv < len(row) else (row[1] if len(row)>1 else "")
            area_val = row[col_area] if 0 <= col_area < len(row) else (row[-1] if len(row)>0 else "")
            
            s_no = s_no.strip()
            subdiv = subdiv.strip()
            area_val = area_val.strip()
            
            # Validation: if S.no has a number in it, consider it a valid row
            if re.search(r'\d+', s_no) or re.search(r'\d+', area_val):
                result['survey_details'].append({
                    "survey_no": s_no,
                    "subdivision": subdiv,
                    "area": area_val
                })
                
                # Fill missing global attributes
                if not result['survey_number']:
                    result['survey_number'] = s_no
                if not result['subdivision'] and subdiv:
                    result['subdivision'] = subdiv
                    
    # Final global survey fallback
    if not result['survey_number']:
        survey_patterns = [
            r'(?:Survey\s*(?:No|Number|#)\.?|S\.?\s*No\.?|Sy\.?\s*No\.?)[:\s]*([\w\d\/\-]+)',
            r'(?:புல\s*எண்|சர்வே\s*எண்)[:\s]*([\w\d\/\-]+)'
        ]
        for pat in survey_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                result['survey_number'] = m.group(1).strip()
                break

    # subdivision extraction fallback from survey number
    if result['survey_number'] and not result['subdivision']:
        parts = re.split(r'[/\-]', result['survey_number'])
        if len(parts) > 1:
            result['survey_number'] = parts[0].strip()
            result['subdivision'] = parts[1].strip()

    return result
