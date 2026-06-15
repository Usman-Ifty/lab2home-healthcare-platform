"""
AI Interpreter — Main Orchestrator

Ties together Gemini Vision extraction, RAG, and classification
into a single interpret_report() function.
"""

import base64
import logging

from services.rag_service import find_reference_range, classify_value, normalize_str
from services.vector_store import find_range_semantic
from services.llm_service import gemini_extract_test_values_from_file, gemini_generate_patient_notes

logger = logging.getLogger(__name__)


def _generate_fallback_note(test_name: str, status: str) -> str:
    """Generate a rule-based note when AI note generation fails."""
    if status == "Good":
        return f"Your {test_name} is within the normal range. No action needed."
    elif status == "Needs Attention":
        return f"Your {test_name} is slightly outside normal range. Please monitor with your doctor."
    elif status == "Critical":
        return f"Your {test_name} is at a critical level. Seek medical attention immediately."
    else:
        return f"Reference range for {test_name} could not be determined automatically."


def interpret_report(pdf_base64: str, patient_profile: dict) -> dict:
    """
    Full interpretation pipeline using Gemini Vision:
      1. Decode Base64 to raw bytes
      2. Gemini Vision extracts test values directly from the image/PDF
      3. RAG enrichment (exact match -> semantic search)
      4. classifyValue() determines Good/Needs Attention/Critical
      5. Gemini Flash generates friendly notes
    """
    age = patient_profile.get("age", 30)
    sex = patient_profile.get("sex", "any")

    # ─── Phase 1: Decode Base64 ──────────────────────────────────
    try:
        file_bytes = base64.b64decode(pdf_base64)
    except Exception as e:
        raise ValueError(f"Invalid file data: {str(e)}")

    # ─── Phase 2: Gemini Vision Extraction ────────────────────────
    logger.info("Phase 1: Extracting test values via Gemini Vision...")
    raw_tests = gemini_extract_test_values_from_file(file_bytes)

    if not raw_tests:
        raise ValueError("Could not identify test values in this report. Please upload a clearer image or PDF.")

    logger.info("Extracted %d raw tests", len(raw_tests))

    # ─── Phase 3: RAG enrichment + classification ─────────────
    logger.info("Phase 2: RAG enrichment...")
    enriched_results = []

    for test in raw_tests:
        try:
            value = float(test.get("value", 0))
        except (ValueError, TypeError):
            continue

        test_name = test.get("testName", "")
        unit = test.get("unit", "")

        # Fast path: exact/alias match
        range_obj = find_reference_range(test_name, age, sex)

        # Semantic path: vector search if exact fails
        if range_obj is None:
            range_obj = find_range_semantic(test_name, age, sex)

        # Classify (YOUR code, never the AI)
        status = classify_value(value, range_obj)

        enriched_results.append({
            "testName": range_obj["testName"] if range_obj else test_name,
            "patientValue": value,
            "unit": unit or (range_obj["unit"] if range_obj else ""),
            "normalMin": range_obj["normalMin"] if range_obj else None,
            "normalMax": range_obj["normalMax"] if range_obj else None,
            "status": status,
            "note": "",
        })

    if not enriched_results:
        raise ValueError("No valid test values found in this report.")

    logger.info("Enriched %d test results", len(enriched_results))

    # ─── Phase 4: Generate patient notes ──────────────────────
    logger.info("Phase 3: Generating patient notes...")
    notes = gemini_generate_patient_notes(enriched_results)

    for result in enriched_results:
        matched_note = None
        for n in notes:
            if normalize_str(n.get("testName", "")) == normalize_str(result["testName"]):
                matched_note = n.get("note", "")
                break
        result["note"] = matched_note or _generate_fallback_note(result["testName"], result["status"])

    # ─── Phase 5: Overall classification ──────────────────────
    has_critical = any(r["status"] == "Critical" for r in enriched_results)
    has_attention = any(r["status"] == "Needs Attention" for r in enriched_results)

    if has_critical:
        overall = "Critical"
        verdict = "Some results require immediate medical attention. Please contact your doctor now."
    elif has_attention:
        overall = "Needs Attention"
        verdict = "Some results need attention. Please consult your doctor for guidance."
    else:
        overall = "Good"
        verdict = "Great news! All your results are within normal range. Keep up your healthy lifestyle."

    verdict += " ⚠️ This is AI-generated guidance, not a medical diagnosis."

    return {
        "overallClassification": overall,
        "verdictMessage": verdict,
        "results": enriched_results,
        "extractionMethod": "gemini-vision",
        "llmUsed": "gemini-1.5-pro",
    }
