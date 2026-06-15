"""
Vector Store Service — Pinecone + MiniLM Embeddings

Manages the cloud vector database for semantic search fallback
when exact/alias matching fails in the RAG pipeline.
"""

import os
import logging
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

from data.medical_reference_db import MEDICAL_REFERENCE_DB
from services.rag_service import _select_best_range

logger = logging.getLogger(__name__)

# Singleton state
_pinecone_index = None
_embedding_model = None
_initialized = False

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384  # MiniLM-L6-v2 output dimension


def _get_embedding_model():
    """Load embedding model (singleton)."""
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading embedding model: %s ...", EMBEDDING_MODEL_NAME)
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        logger.info("✅ Embedding model loaded")
    return _embedding_model


def init_vector_store():
    """
    Initialize Pinecone index and seed with medical reference embeddings.
    Uses singleton pattern — safe to call multiple times.
    """
    global _pinecone_index, _initialized

    if _initialized:
        logger.info("Vector store already initialized, skipping.")
        return

    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "lab2home-medical")

    if not api_key:
        logger.warning("⚠️ PINECONE_API_KEY not set — vector search disabled")
        return

    try:
        # Initialize Pinecone client
        pc = Pinecone(api_key=api_key)

        # Check if index exists, create if not
        existing_indexes = [idx.name for idx in pc.list_indexes()]

        if index_name not in existing_indexes:
            logger.info("Creating Pinecone index: %s ...", index_name)
            pc.create_index(
                name=index_name,
                dimension=EMBEDDING_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            logger.info("✅ Pinecone index created: %s", index_name)

        _pinecone_index = pc.Index(index_name)

        # Check if data already seeded
        stats = _pinecone_index.describe_index_stats()
        total_vectors = stats.get("total_vector_count", 0)

        if total_vectors >= len(MEDICAL_REFERENCE_DB):
            logger.info(
                "✅ Vector store ready with %d documents (already seeded)",
                total_vectors,
            )
            _initialized = True
            return

        # Seed the index with medical reference embeddings
        logger.info("Seeding Pinecone with %d medical test entries...", len(MEDICAL_REFERENCE_DB))
        model = _get_embedding_model()

        vectors = []
        for test in MEDICAL_REFERENCE_DB:
            embedding = model.encode(test["content"]).tolist()
            vectors.append({
                "id": test["id"],
                "values": embedding,
                "metadata": {
                    "name": test["name"],
                    "aliases": ",".join(test.get("aliases", [])),
                    "criticalLow": test.get("criticalLow", 0.0),
                    "criticalHigh": test.get("criticalHigh", 0.0),
                    "qualitative": str(test.get("qualitative", False)),
                    "positiveStatus": test.get("positiveStatus", ""),
                    "negativeStatus": test.get("negativeStatus", ""),
                    # Store ranges as JSON string (Pinecone metadata limits)
                    "ranges_json": str(test.get("ranges", [])),
                },
            })

        # Upsert in batch
        _pinecone_index.upsert(vectors=vectors)

        _initialized = True
        logger.info("✅ Vector store ready with %d documents", len(MEDICAL_REFERENCE_DB))

    except Exception as e:
        logger.error("❌ Vector store initialization failed: %s", str(e))
        raise


def find_range_semantic(test_name: str, age: int, sex: str) -> dict | None:
    """
    Semantic search fallback: embed the test name and query Pinecone
    for the nearest medical test entry.

    Returns same shape as rag_service.find_reference_range():
    { normalMin, normalMax, unit, criticalLow, criticalHigh, testName }
    """
    global _pinecone_index

    if _pinecone_index is None:
        logger.warning("Vector store not initialized — semantic search unavailable")
        return None

    try:
        model = _get_embedding_model()
        query_embedding = model.encode(test_name).tolist()

        results = _pinecone_index.query(
            vector=query_embedding,
            top_k=1,
            include_metadata=True,
        )

        if not results.get("matches") or len(results["matches"]) == 0:
            return None

        match = results["matches"][0]

        # Check confidence threshold
        if match["score"] < 0.4:
            logger.info(
                "Semantic match too weak for '%s': score=%.3f",
                test_name, match["score"],
            )
            return None

        metadata = match["metadata"]
        logger.info(
            "🔍 Semantic match: '%s' → '%s' (score=%.3f)",
            test_name, metadata["name"], match["score"],
        )

        # Parse ranges from metadata
        import ast
        ranges = ast.literal_eval(metadata["ranges_json"])

        # Canonical sex
        sex_lower = (sex or "").lower()
        canonical_sex = "male" if sex_lower == "male" else ("female" if sex_lower == "female" else "any")

        best_range = _select_best_range(ranges, age, canonical_sex)
        if not best_range and metadata.get("qualitative") != "True":
            return None

        return {
            "testName": metadata["name"],
            "normalMin": best_range["min"] if best_range else None,
            "normalMax": best_range["max"] if best_range else None,
            "unit": best_range["unit"] if best_range else "",
            "criticalLow": metadata.get("criticalLow", 0.0),
            "criticalHigh": metadata.get("criticalHigh", 0.0),
            "qualitative": metadata.get("qualitative") == "True",
            "positiveStatus": metadata.get("positiveStatus"),
            "negativeStatus": metadata.get("negativeStatus"),
        }

    except Exception as e:
        logger.error("Semantic search failed for '%s': %s", test_name, str(e))
        return None
