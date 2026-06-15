"""
LLM Service — Gemini Vision
"""

import os
import re
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

GEMINI_VISION_MODEL = "gemini-2.5-flash"
GEMINI_NOTES_MODEL = "gemini-2.5-flash"


def _extract_json_from_response(text: str) -> str:
    """Strip markdown fences and extract JSON array or object."""
    # Strip markdown code fences
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    # Try to extract JSON array
    arr_match = re.search(r"\[[\s\S]*\]", text)
    if arr_match:
        return arr_match.group(0)

    # Try to extract JSON object
    obj_match = re.search(r"\{[\s\S]*\}", text)
    if obj_match:
        return obj_match.group(0)

    return text


def detect_mime_type(data: bytes) -> str:
    """Detect mime type from magic bytes."""
    if data[:4] == b"%PDF": return "application/pdf"
    if data[:2] == b"\xff\xd8": return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n": return "image/png"
    if data[:4] in (b"RIFF",) and data[8:12] == b"WEBP": return "image/webp"
    return "application/pdf"


def gemini_extract_test_values_from_file(file_bytes: bytes) -> list[dict]:
    """Pass file directly to Gemini Vision API for tabular data extraction."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_VISION_MODEL)
    
    mime_type = detect_mime_type(file_bytes)
    logger.info("Sending file to Gemini Vision as %s", mime_type)
    
    document_part = {
        "mime_type": mime_type,
        "data": file_bytes
    }
    
    prompt = (
        "You are an expert medical data extractor. Extract all lab test results from this medical report.\n"
        "Return ONLY a JSON array, no markdown, no explanation.\n"
        '[{"testName": "Hemoglobin", "value": 11.2, "unit": "g/dL"}]\n\n'
        "Rules:\n"
        "- Read tables very carefully. Do not mix up rows and columns.\n"
        "- Only include tests with clear numeric values.\n"
        "- Normalize common aliases (e.g. SGPT -> ALT, TLC -> WBC, FBS -> Fasting Blood Sugar).\n"
        "- Leave unit as empty string if not found.\n"
        "- Return empty array [] if no tests found."
    )

    try:
        response = model.generate_content([prompt, document_part])
        result_text = response.text
        json_str = _extract_json_from_response(result_text)
        tests = json.loads(json_str)
        return tests if isinstance(tests, list) else []
    except Exception as e:
        logger.error("Gemini Vision extraction failed: %s", str(e))
        return []


def gemini_generate_patient_notes(enriched_results: list[dict]) -> list[dict]:
    """Generate patient-friendly notes using Gemini Flash."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_NOTES_MODEL)

    simplified = [
        {
            "testName": r["testName"],
            "value": r["patientValue"],
            "unit": r["unit"],
            "normalRange": f"{r['normalMin']}-{r['normalMax']}" if r.get("normalMin") is not None else "N/A",
            "status": r["status"],
        }
        for r in enriched_results
    ]

    prompt = (
        "Write a short patient-friendly note for each lab result.\n"
        "Simple English. Max 2 sentences each.\n"
        'Return ONLY JSON array: [{"testName": "...", "note": "..."}]\n\n'
        f"Results: {json.dumps(simplified)}"
    )

    try:
        response = model.generate_content(prompt)
        json_str = _extract_json_from_response(response.text)
        notes = json.loads(json_str)
        return notes if isinstance(notes, list) else []
    except Exception as e:
        logger.error("Gemini generate_patient_notes failed: %s", str(e))
        return []
