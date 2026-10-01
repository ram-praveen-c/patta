"""
Survey Number Normalization & Land Identifier Module
Robustly extracts, parses, and normalizes survey numbers and subdivisions
from Tamil, English, and bilingual land documents (Patta/Chitta, Sale Deed).
"""

import re
from typing import Dict, Any, Optional, Tuple


def normalize_survey_identifier(raw_input: Optional[str]) -> Dict[str, Any]:
    """
    Normalizes a survey identifier string into structured components:
    - survey_number: base survey number (e.g. '125')
    - subdivision: subdivision code (e.g. '3A')
    - survey_display: standard cadastral display (e.g. '125/3A')
    - confidence: extraction & parsing confidence score (0.0 - 1.0)
    """
    if not raw_input or not isinstance(raw_input, str):
        return {
            "survey_number": None,
            "subdivision": None,
            "survey_display": None,
            "confidence": 0.0,
            "raw_text": "",
            "is_valid": False
        }

    cleaned = raw_input.strip()
    original_raw = cleaned

    # Check SY/142/A or SY/142/1A format before generic prefix stripping
    sy_match = re.match(r'^SY\s*[/.\-]\s*([0-9]+)\s*(?:[/.\-]\s*([A-Za-z0-9\-]+))?$', cleaned, re.IGNORECASE)
    if sy_match:
        survey_num = sy_match.group(1).strip()
        subdiv = sy_match.group(2).strip().upper() if sy_match.group(2) else None
        display = f"{survey_num}/{subdiv}" if subdiv else survey_num
        return {
            "survey_number": survey_num,
            "subdivision": subdiv,
            "survey_display": display,
            "confidence": 0.96,
            "raw_text": original_raw,
            "is_valid": True
        }

    # 1. Remove common prefixes (English, Tamil, and Hindi)
    prefixes = [
        r'^(?:Survey\s*(?:No|Number|#)?\.?|S\.?\s*No\.?|Sy\.?\s*No\.?|S\.?No\.?)\s*[:.\-]?\s*',
        r'^(?:புல\s*எண்|சர்வே\s*எண்|புல\s*எ\.?|சர்வே\s*எ\.?)\s*[:.\-]?\s*',
        r'^(?:सर्वेक्षण\s*संख्या|सर्वे\s*संख्या|सर्वे\s*नं\.?|खसरा\s*संख्या|खसरा\s*नं\.?|गाटा\s*संख्या)\s*[:.\-]?\s*',
        r'^(?:Survey|Sy|SurveyNumber)\s*[:.\-]?\s*',
    ]
    has_explicit_prefix = False
    for pref in prefixes:
        match = re.match(pref, cleaned, re.IGNORECASE)
        if match:
            cleaned = cleaned[match.end():].strip()
            has_explicit_prefix = True
            break

    # Also strip leading and trailing punctuation/slashes
    cleaned = re.sub(r'^[/:.\-\s]+', '', cleaned)
    cleaned = re.sub(r'[,;.\-\s]+$', '', cleaned).strip()

    # Standard formats:
    # 125/1, 125/1A, 125/3A, 125 / 3A, 125-1A, 125-A, 125/3, 125
    # Regex breakdown:
    # Group 1: Base survey number (digits)
    # Group 2: Delimiter (/ or - or space)
    # Group 3: Subdivision (digits, letters, or combination like 1A, 3B, 2)
    standard_pattern = r'^([0-9]+)\s*([/\-])\s*([A-Za-z0-9]+(?:\s*[A-Za-z0-9]+)?)$'
    m_std = re.match(standard_pattern, cleaned)
    if m_std:
        survey_num = m_std.group(1).strip()
        subdiv = m_std.group(3).strip().upper().replace(" ", "")
        display = f"{survey_num}/{subdiv}"
        conf = 0.98 if has_explicit_prefix else 0.92
        return {
            "survey_number": survey_num,
            "subdivision": subdiv,
            "survey_display": display,
            "confidence": conf,
            "raw_text": original_raw,
            "is_valid": True
        }

    # Format where survey has alphabetic prefix e.g. 125A or 125-A
    alpha_subdiv_pattern = r'^([0-9]+)\s*([A-Za-z]+)$'
    m_alpha = re.match(alpha_subdiv_pattern, cleaned)
    if m_alpha:
        survey_num = m_alpha.group(1).strip()
        subdiv = m_alpha.group(2).strip().upper()
        display = f"{survey_num}/{subdiv}"
        conf = 0.90 if has_explicit_prefix else 0.85
        return {
            "survey_number": survey_num,
            "subdivision": subdiv,
            "survey_display": display,
            "confidence": conf,
            "raw_text": original_raw,
            "is_valid": True
        }

    # Pure numeric survey without subdivision: e.g. "125"
    if cleaned.isdigit():
        return {
            "survey_number": cleaned,
            "subdivision": None,
            "survey_display": cleaned,
            "confidence": 0.95 if has_explicit_prefix else 0.80,
            "raw_text": original_raw,
            "is_valid": True
        }

    # Multi-part survey format e.g. "125/1/2" or "125/1A/2"
    multi_part = re.match(r'^([0-9]+)\s*/\s*([A-Za-z0-9]+)\s*/\s*([A-Za-z0-9]+)$', cleaned)
    if multi_part:
        survey_num = multi_part.group(1).strip()
        subdiv = f"{multi_part.group(2).strip().upper()}/{multi_part.group(3).strip().upper()}"
        display = f"{survey_num}/{subdiv}"
        return {
            "survey_number": survey_num,
            "subdivision": subdiv,
            "survey_display": display,
            "confidence": 0.91,
            "raw_text": original_raw,
            "is_valid": True
        }

    # Fallback: extract first number found as survey_number
    num_match = re.search(r'\d+', cleaned)
    if num_match:
        survey_num = num_match.group(0)
        # Check remainder for potential subdivision
        remainder = cleaned[num_match.end():].strip().strip("/- ")
        subdiv = remainder.upper() if remainder else None
        display = f"{survey_num}/{subdiv}" if subdiv else survey_num
        return {
            "survey_number": survey_num,
            "subdivision": subdiv,
            "survey_display": display,
            "confidence": 0.65,
            "raw_text": original_raw,
            "is_valid": True
        }

    # Could not reliably parse
    return {
        "survey_number": None,
        "subdivision": None,
        "survey_display": original_raw,
        "confidence": 0.20,
        "raw_text": original_raw,
        "is_valid": False
    }


def extract_survey_identifiers_from_text(text: str) -> Dict[str, Any]:
    """
    Scans entire document text for survey number patterns and returns the best candidate.
    Supports English & Tamil variations.
    """
    patterns = [
        # Explicit Survey No with subdivision (e.g. Survey No: 125/3A, S.No. 125/1)
        r'(?:Survey\s*(?:No|Number|#)?\.?|S\.?\s*No\.?|Sy\.?\s*No\.?|S\.?No\.?)\s*[:.\-]?\s*([0-9]+[A-Za-z0-9/ \-]+)',
        # Tamil: புல எண் / சர்வே எண்
        r'(?:புல\s*எண்|சர்வே\s*எண்|புல\s*எ\.?|சர்வே\s*எ\.?)\s*[:.\-]?\s*([0-9]+[A-Za-z0-9/ \-]+)',
        # Hindi: सर्वेक्षण संख्या / खसरा संख्या / गाटा संख्या
        r'(?:सर्वेक्षण\s*संख्या|सर्वे\s*संख्या|सर्वे\s*नं\.?|खसरा\s*संख्या|खसरा\s*नं\.?|गाटा\s*संख्या)\s*[:.\-]?\s*([0-9]+[A-Za-z0-9/ \-]+)',
        # Standalone SY/...
        r'\b(SY\s*/\s*[0-9]+(?:/[A-Za-z0-9]+)?)\b',
    ]

    candidates = []

    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw_val = match.group(1).strip()
            parsed = normalize_survey_identifier(raw_val)
            if parsed["is_valid"]:
                candidates.append(parsed)

    if candidates:
        # Sort by confidence descending
        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        return candidates[0]

    return {
        "survey_number": None,
        "subdivision": None,
        "survey_display": None,
        "confidence": 0.0,
        "raw_text": "",
        "is_valid": False
    }


def match_normalized_surveys(
    target_survey: str,
    target_subdiv: Optional[str],
    candidate_survey: str,
    candidate_subdiv: Optional[str]
) -> Tuple[bool, str, float]:
    """
    Compares two survey identifiers using normalized comparison rules.
    Returns:
    - (is_matched, match_type, confidence_score)
    where match_type is 'exact', 'survey_only', or 'none'.
    """
    t_s = normalize_survey_identifier(target_survey)
    c_s = normalize_survey_identifier(candidate_survey)

    if not t_s["is_valid"] or not c_s["is_valid"]:
        return False, "none", 0.0

    # Clean survey numbers
    target_num = t_s["survey_number"].lower()
    candidate_num = c_s["survey_number"].lower()

    if target_num != candidate_num:
        return False, "none", 0.0

    # Determine effective subdivisions
    eff_target_sub = (target_subdiv or t_s["subdivision"] or "").strip().upper().replace(" ", "")
    eff_cand_sub = (candidate_subdiv or c_s["subdivision"] or "").strip().upper().replace(" ", "")

    # Both have subdivisions
    if eff_target_sub and eff_cand_sub:
        if eff_target_sub == eff_cand_sub:
            return True, "exact", 1.0
        # Partial match (e.g. 1A vs 1, or 3A vs 3)
        if eff_target_sub.startswith(eff_cand_sub) or eff_cand_sub.startswith(eff_target_sub):
            return True, "normalized_partial", 0.88
        return False, "none", 0.0

    # Neither has subdivision -> full survey match
    if not eff_target_sub and not eff_cand_sub:
        return True, "exact", 0.98

    # One has subdivision, one does not
    return True, "survey_only", 0.75
