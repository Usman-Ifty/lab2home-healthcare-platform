"""
Lab2Home AI Service — FastAPI Application

Python microservice that handles AI-powered lab report interpretation:
- 3-tier OCR (pdfplumber → HuggingFace TrOCR → Tesseract)
- HuggingFace LLM (Qwen2.5-7B) with Gemini fallback
- RAG pipeline with Pinecone vector search
"""

import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.vector_store import init_vector_store
from services.interpreter import interpret_report

# ─── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup/shutdown) ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize vector store on startup."""
    logger.info("🚀 Starting Lab2Home AI Service...")
    try:
        init_vector_store()
    except Exception as e:
        logger.warning("⚠️ Vector store init failed (semantic search disabled): %s", str(e))
    yield
    logger.info("👋 Shutting down AI Service")


# ─── FastAPI App ──────────────────────────────────────────────
app = FastAPI(
    title="Lab2Home AI Service",
    description="AI-powered lab report interpretation microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ─────────────────────────────────

class PatientProfile(BaseModel):
    age: int
    sex: str
    weight: float | None = None
    conditions: list[str] = []


class InterpretRequest(BaseModel):
    pdf_base64: str
    patient_profile: PatientProfile


class TestResult(BaseModel):
    testName: str
    patientValue: float
    unit: str
    normalMin: float | None
    normalMax: float | None
    status: str
    note: str


class InterpretResponse(BaseModel):
    overallClassification: str
    verdictMessage: str
    results: list[TestResult]
    extractionMethod: str
    llmUsed: str


# ─── Endpoints ────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "lab2home-ai"}


@app.post("/interpret", response_model=InterpretResponse)
def interpret(request: InterpretRequest):
    """
    Interpret a lab report PDF.

    Receives base64-encoded PDF + patient profile.
    Returns classified results with patient-friendly notes.
    """
    try:
        result = interpret_report(
            pdf_base64=request.pdf_base64,
            patient_profile=request.patient_profile.model_dump(),
        )
        return result

    except ValueError as e:
        # Expected errors (bad PDF, no tests found, etc.)
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        # Service unavailable
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Interpretation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="AI interpretation failed. Please try again later.",
        )


# ─── Run ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
