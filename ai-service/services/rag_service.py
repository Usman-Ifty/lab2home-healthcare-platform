"""
RAG Lookup Service

Matches extracted test names against the medical reference database
and classifies patient values as Good / Needs Attention / Critical.
"""

import re
from data.medical_reference_db import MEDICAL_REFERENCE_DB


def normalize_str(s: str) -> str:
    """Lowercase + remove non-alphanumeric characters."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def find_reference_range(test_name: str, age: int, sex: str) -> dict | None:
    """
    Find the best-matching reference range for a given test name,
    filtered by patient age and sex.

    Matching strategy:
      1. Exact normalized match on name
      2. Exact normalized match on any alias
      3. Partial match (input contains alias or alias contains input)

    Returns: { normalMin, normalMax, unit, criticalLow, criticalHigh, testName }
    """
    normalized_input = normalize_str(test_name)
    if not normalized_input:
        return None

    # Canonical sex
    sex_lower = (sex or "").lower()
    canonical_sex = "male" if sex_lower == "male" else ("female" if sex_lower == "female" else "any")

    matched_test = None

    # Phase 1: Exact name match
    for test in MEDICAL_REFERENCE_DB:
        if normalize_str(test["name"]) == normalized_input:
            matched_test = test
            break

    # Phase 2: Exact alias match
    if not matched_test:
        for test in MEDICAL_REFERENCE_DB:
            for alias in test["aliases"]:
                if normalize_str(alias) == normalized_input:
                    matched_test = test
                    break
            if matched_test:
                break

    # Phase 3: Partial match
    if not matched_test:
        for test in MEDICAL_REFERENCE_DB:
            norm_name = normalize_str(test["name"])
            if normalized_input in norm_name or norm_name in normalized_input:
                matched_test = test
                break
            for alias in test["aliases"]:
                norm_alias = normalize_str(alias)
                if normalized_input in norm_alias or norm_alias in normalized_input:
                    matched_test = test
                    break
            if matched_test:
                break

    if not matched_test:
        return None

    # Find the best range for this patient
    best_range = _select_best_range(matched_test.get("ranges", []), age, canonical_sex)
    if not best_range and not matched_test.get("qualitative"):
        return None

    return {
        "testName": matched_test["name"],
        "normalMin": best_range["min"] if best_range else None,
        "normalMax": best_range["max"] if best_range else None,
        "unit": best_range["unit"] if best_range else "",
        "criticalLow": matched_test.get("criticalLow"),
        "criticalHigh": matched_test.get("criticalHigh"),
        "qualitative": matched_test.get("qualitative", False),
        "positiveStatus": matched_test.get("positiveStatus"),
        "negativeStatus": matched_test.get("negativeStatus"),
    }


def _select_best_range(ranges: list, age: int, sex: str) -> dict | None:
    """Select the most specific range matching patient age and sex."""
    # Filter ranges that cover the patient's age
    age_matches = [r for r in ranges if r["minAge"] <= age <= r["maxAge"]]
    if not age_matches:
        return None

    # Prefer sex-specific match
    sex_specific = [r for r in age_matches if r["sex"] == sex]
    if sex_specific:
        return min(sex_specific, key=lambda r: r["maxAge"] - r["minAge"])

    # Fallback to 'any' sex
    any_match = [r for r in age_matches if r["sex"] == "any"]
    if any_match:
        return min(any_match, key=lambda r: r["maxAge"] - r["minAge"])

    # Last resort
    return age_matches[0]


def classify_value(value, range_obj: dict | None) -> str:
    """
    Classify a numeric or qualitative value against a reference range.
    Returns: 'Good' | 'Needs Attention' | 'Critical' | 'Unknown'

    IMPORTANT: This function — not the AI — always controls classification.
    """
    if range_obj is None:
        return "Unknown"

    if range_obj.get("qualitative"):
        v = str(value).lower().strip()
        is_positive = (
            "positive" in v or
            v == "reactive" or
            v == "detected" or
            v == "present" or
            v == "yes"
        )
        is_negative = (
            "negative" in v or
            v == "non-reactive" or
            v == "not detected" or
            v == "absent" or
            v == "no" or
            v == "nil"
        )
        if is_positive:
            return range_obj.get("positiveStatus", "Needs Attention")
        if is_negative:
            return range_obj.get("negativeStatus", "Good")
        return "Unknown"

    try:
        num = float(value)
    except (ValueError, TypeError):
        return "Unknown"

    critical_low = range_obj.get("criticalLow")
    critical_high = range_obj.get("criticalHigh")

    # Check critical thresholds first
    if critical_low is not None and num < critical_low:
        return "Critical"
    if critical_high is not None and num > critical_high:
        return "Critical"

    # Check normal range
    normal_min = range_obj.get("normalMin")
    normal_max = range_obj.get("normalMax")

    if normal_min is not None and normal_max is not None:
        if normal_min <= num <= normal_max:
            return "Good"

    # Outside normal but not critical
    return "Needs Attention"
