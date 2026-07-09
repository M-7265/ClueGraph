"""
main.py — FastAPI application entry point for ClueGraph.

On startup:
  1. Loads .env (SIMULATION_MODE, OLLAMA_BASE_URL, OLLAMA_MODEL).
  2. If not in SIMULATION_MODE: creates a ChromaDB in-memory client,
     seeds it with the 4 case file documents, and initialises the OpenAI
     client pointed at Ollama.
  3. Mounts the RAG router and configures CORS for the Next.js dev server.

Run with:
    uvicorn main:app --reload --port 8000
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from typing import List

# Load environment variables from .env file BEFORE importing modules that depend on them
load_dotenv()

from rag import init_rag, router as rag_router
from seed import seed_database, MYSTERIES

SIMULATION_MODE: bool = os.getenv("SIMULATION_MODE", "true").lower() == "true"
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1/")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")

app = FastAPI(
    title="ClueGraph API",
    description=(
        "Backend for ClueGraph — contrasting Naive RAG vs Multi-Hop Agentic RAG "
        "on a detective mystery dataset."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server (and production build) to call the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: seed the database and initialise shared resources
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event() -> None:
    if SIMULATION_MODE:
        print("[SIM] SIMULATION_MODE=true -- ChromaDB and Ollama are bypassed.")
        # Pass dummy objects; rag.py will never call them in simulation mode.
        init_rag(collection=None, llm_client=None)
    else:
        import mock_chroma as chromadb
        from openai import OpenAI
        print("[Mock Chroma] Connecting to Mock ChromaDB (in-memory) and seeding case files...")
        chroma_client = chromadb.Client()
        collection = chroma_client.get_or_create_collection(
            name="cluegraph_cases",
            metadata={"hnsw:space": "cosine"},
        )
        seed_database(collection)

        print(f"[LLM] Connecting to LLM at {os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434/v1/')}...")
        import httpx
        llm_client = OpenAI(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1/"),
            api_key=os.getenv("GROQ_API_KEY", "ollama"),
            http_client=httpx.Client(verify=False)
        )

        init_rag(collection=collection, llm_client=llm_client)
        print("[Ready] Backend ready (SIMULATION_MODE=false)")
        print("[Ready] LLM client ready.")

    print(
        "\n[ClueGraph] Backend is live!\n"
        "   Naive RAG  ->  GET http://localhost:8000/api/naive-rag\n"
        "   Agentic    ->  GET http://localhost:8000/api/agentic-rag\n"
        "   API docs   ->  http://localhost:8000/docs\n"
    )


# ---------------------------------------------------------------------------
# API Endpoints for Mysteries
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint to expose server configuration."""
    return {"status": "ok", "simulation_mode": SIMULATION_MODE}

@app.get("/api/mysteries")
async def get_mysteries():
    """Return available pre-defined mysteries."""
    return [
        {
            "id": m["id"],
            "title": m["title"],
            "description": m["description"],
            "query": m["query"]
        }
        for m in MYSTERIES.values()
    ]

class CustomDocument(BaseModel):
    title: str
    category: str
    content: str

class CustomMystery(BaseModel):
    title: str
    description: str
    query: str
    documents: List[CustomDocument]

@app.post("/api/mysteries/custom")
async def create_custom_mystery(mystery: CustomMystery):
    """Upload a custom mystery (requires SIMULATION_MODE=false)."""
    if SIMULATION_MODE:
        return {"error": "Custom mysteries require SIMULATION_MODE=false and Ollama running."}
    
    import uuid
    import mock_chroma as chromadb
    
    mystery_id = f"custom_{uuid.uuid4().hex[:8]}"
    
    # We need to access the collection to upsert
    chroma_client = chromadb.Client()
    collection = chroma_client.get_or_create_collection(
        name="cluegraph_cases",
        metadata={"hnsw:space": "cosine"},
    )
    
    collection.upsert(
        ids=[f"{mystery_id}_doc_{i}" for i in range(len(mystery.documents))],
        documents=[doc.content for doc in mystery.documents],
        metadatas=[
            {
                "title": doc.title,
                "category": doc.category,
                "mystery_id": mystery_id
            }
            for doc in mystery.documents
        ],
    )
    
    return {"id": mystery_id, "status": "success"}

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(rag_router)

