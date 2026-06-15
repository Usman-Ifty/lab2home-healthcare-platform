"""
OCR Service — 3-Tier Text Extraction Pipeline

Handles both PDF and image-based lab reports.

Tier 1: pdfplumber (digital PDFs, instant)
Tier 2: HuggingFace TrOCR API (scanned PDFs / images)
Tier 3: pytesseract (offline fallback)
"""

import os
import re
import io
import time
import logging
import httpx

logger = logging.getLogger(__name__)

# Medical keywords for quality check
MEDICAL_KEYWORDS = [
    "hemoglobin", "glucose", "creatinine", "wbc", "rbc", "platelet",
    "hb", "cbc", "blood", "urine", "sugar", "tsh", "alt", "ast",
    "cholesterol", "triglyceride", "bilirubin", "sodium", "potassium",
    "urea", "hba1c", "esr", "mcv", "mch", "mchc", "sgpt", "sgot",
]


def clean_text(text: str) -> str:
    """Remove non-ASCII, collapse excessive whitespace/newlines."""
    text = re.sub(r"[^\x20-\x7E\n\r\t]", " ", text)  # Non-ASCII → space
    text = re.sub(r" {3,}", "  ", text)                # 3+ spaces → 2
    text = re.sub(r"\n{4,}", "\n\n", text)             # 4+ newlines → 2
    return text.strip()


def is_text_good_quality(text: str) -> bool:
    """Check if extracted text is 'good enough' to use."""
    if len(text) < 150:
        return False
    if not re.search(r"\d+\.?\d*", text):
        return False
    lower_text = text.lower()
    return any(kw in lower_text for kw in MEDICAL_KEYWORDS)


def _detect_file_type(data: bytes) -> str:
    """Detect if data is PDF, image, or unknown based on magic bytes."""
    if data[:4] == b"%PDF":
        return "pdf"
    if data[:2] == b"\xff\xd8":
        return "jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] in (b"RIFF",) and data[8:12] == b"WEBP":
        return "webp"
    if data[:3] == b"GIF":
        return "gif"
    if data[:2] in (b"BM",):
        return "bmp"
    # Could still be a PDF with leading whitespace
    if b"%PDF" in data[:1024]:
        return "pdf"
    return "unknown"


# ─── TIER 1: pdfplumber (digital PDFs) ────────────────────────

def _extract_with_pdfplumber(pdf_bytes: bytes) -> dict | None:
    """Extract text directly from digital PDF."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)
            raw = "\n\n".join(pages_text)

        cleaned = clean_text(raw)
        if is_text_good_quality(cleaned):
            logger.info("✅ Tier 1 (pdfplumber): Good text extracted (%d chars)", len(cleaned))
            return {"method": "pdf-text", "text": cleaned}

        logger.info("📄 Tier 1 (pdfplumber): Text quality insufficient, falling through...")
        return None
    except Exception as e:
        logger.error("📄 Tier 1 (pdfplumber) failed: %s", str(e))
        return None


# ─── TIER 2: HuggingFace TrOCR API ────────────────────────────

def _extract_with_huggingface_ocr(image_buffers: list[bytes]) -> dict | None:
    """OCR images using HuggingFace TrOCR API."""
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key:
        logger.info("🤖 Tier 2 (HF TrOCR): No HUGGINGFACE_API_KEY, skipping...")
        return None

    if not image_buffers:
        logger.warning("🤖 Tier 2: No images to process")
        return None

    try:
        model_url = "https://api-inference.huggingface.co/models/microsoft/trocr-large-printed"
        headers = {"Authorization": f"Bearer {api_key}"}

        all_text = []
        for i, img_bytes in enumerate(image_buffers):
            for attempt in range(2):
                try:
                    response = httpx.post(
                        model_url,
                        headers=headers,
                        content=img_bytes,
                        timeout=30.0,
                    )

                    if response.status_code == 503:
                        data = response.json()
                        if "loading" in str(data).lower():
                            logger.info("🤖 Tier 2: Model loading, waiting 15s...")
                            time.sleep(15)
                            continue

                    response.raise_for_status()
                    result = response.json()

                    if isinstance(result, list) and len(result) > 0:
                        text = result[0].get("generated_text", "")
                        all_text.append(text)
                    elif isinstance(result, dict):
                        text = result.get("generated_text", "")
                        all_text.append(text)
                    break

                except Exception as e:
                    if attempt == 0:
                        logger.warning("🤖 Tier 2: Retry for page %d: %s", i + 1, str(e))
                        time.sleep(5)
                    else:
                        logger.error("🤖 Tier 2: Failed page %d: %s", i + 1, str(e))

            # Rate limit between pages
            if i < len(image_buffers) - 1:
                time.sleep(1)

        raw = "\n\n--- Page Break ---\n\n".join(all_text)
        cleaned = clean_text(raw)

        if is_text_good_quality(cleaned):
            logger.info("✅ Tier 2 (HF TrOCR): OCR extracted (%d chars)", len(cleaned))
            return {"method": "hf-ocr", "text": cleaned}

        logger.info("🤖 Tier 2 (HF TrOCR): Text quality insufficient")
        return None

    except Exception as e:
        logger.error("🤖 Tier 2 (HF TrOCR) failed: %s", str(e))
        return None


# ─── TIER 3: Tesseract (offline fallback) ─────────────────────

def _extract_with_tesseract(image_buffers: list[bytes]) -> dict | None:
    """OCR using local Tesseract installation."""
    if not image_buffers:
        logger.warning("🔍 Tier 3: No images to process")
        return None

    try:
        import pytesseract
        from PIL import Image

        all_text = []
        for i, img_bytes in enumerate(image_buffers):
            img = Image.open(io.BytesIO(img_bytes))
            text = pytesseract.image_to_string(
                img,
                lang="eng",
                config="--psm 6 --oem 3",
            )
            all_text.append(text)

        raw = "\n\n".join(all_text)
        cleaned = clean_text(raw)

        if len(cleaned) > 50:
            logger.info("✅ Tier 3 (Tesseract): OCR extracted (%d chars)", len(cleaned))
            return {"method": "tesseract", "text": cleaned}

        logger.info("🔍 Tier 3 (Tesseract): Insufficient text")
        return None

    except ImportError:
        logger.warning("🔍 Tier 3: pytesseract not installed (run 'pip install pytesseract')")
        return None
    except Exception as e:
        error_str = str(e).lower()
        if "is not installed" in error_str or "not in your path" in error_str:
            logger.warning("🔍 Tier 3 skipped: Tesseract binary not installed on system")
        else:
            logger.error("🔍 Tier 3 (Tesseract) failed: %s", str(e))
        return None


# ─── PDF to Images helper ─────────────────────────────────────

def _pdf_to_images(pdf_bytes: bytes) -> list[bytes]:
    """Convert PDF pages to JPEG image buffers using pdf2image (requires poppler)."""
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_bytes, dpi=250, fmt="jpeg")
        result = []
        for img in images:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=90)
            result.append(buf.getvalue())
        return result
    except Exception as e:
        logger.error("PDF to images conversion failed: %s", str(e))
        return []


def _image_to_jpeg(image_bytes: bytes) -> list[bytes]:
    """Convert a single image (any format) to a JPEG buffer."""
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if needed (e.g., PNG with alpha)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return [buf.getvalue()]
    except Exception as e:
        logger.error("Image conversion failed: %s", str(e))
        return []


# ─── MAIN PIPELINE ────────────────────────────────────────────

def extract_from_report(file_bytes: bytes) -> dict:
    """
    Extract report data from PDF or image bytes using 3-tier pipeline.
    Automatically detects if the input is a PDF or an image.
    Returns: { method: str, text: str }
    Raises if all tiers fail.
    """
    file_type = _detect_file_type(file_bytes)
    logger.info("Detected file type: %s (%d bytes)", file_type, len(file_bytes))

    if file_type == "pdf":
        # ── PDF path ──────────────────────────────────────────
        # Tier 1: Direct text extraction
        tier1 = _extract_with_pdfplumber(file_bytes)
        if tier1:
            return tier1

        # Convert PDF to images for OCR tiers
        page_images = _pdf_to_images(file_bytes)

        if page_images:
            # Tier 2: HuggingFace TrOCR
            tier2 = _extract_with_huggingface_ocr(page_images)
            if tier2:
                return tier2

            # Tier 3: Tesseract
            tier3 = _extract_with_tesseract(page_images)
            if tier3:
                return tier3
        else:
            logger.warning("Could not convert PDF to images — poppler may not be installed")

    elif file_type in ("jpeg", "png", "webp", "gif", "bmp"):
        # ── Image path (report is an image, not PDF) ──────────
        logger.info("Report is an image (%s), running OCR directly...", file_type)
        image_buffers = _image_to_jpeg(file_bytes)

        if image_buffers:
            # Tier 2: HuggingFace TrOCR
            tier2 = _extract_with_huggingface_ocr(image_buffers)
            if tier2:
                return tier2

            # Tier 3: Tesseract
            tier3 = _extract_with_tesseract(image_buffers)
            if tier3:
                return tier3

    else:
        # ── Unknown format — try everything ───────────────────
        logger.warning("Unknown file format, trying all extraction methods...")

        # Try as PDF first
        tier1 = _extract_with_pdfplumber(file_bytes)
        if tier1:
            return tier1

        # Try as image
        image_buffers = _image_to_jpeg(file_bytes)
        if image_buffers:
            tier2 = _extract_with_huggingface_ocr(image_buffers)
            if tier2:
                return tier2
            tier3 = _extract_with_tesseract(image_buffers)
            if tier3:
                return tier3

    raise ValueError("Could not read this report. Please upload a clearer PDF or image.")
