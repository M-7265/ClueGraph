"""
rag.py — RAG logic: retrieval helpers, LLM calls, and the two API endpoints.
"""

import asyncio
import json
import os
from typing import AsyncGenerator

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse

from seed import MYSTERIES

router = APIRouter()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SIMULATION_MODE: bool = os.getenv("SIMULATION_MODE", "true").lower() == "true"
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1/")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
MAX_HOPS: int = 4

# Lazy references — populated by main.py after ChromaDB is ready.
_collection = None
_llm_client = None


def init_rag(collection, llm_client) -> None:
    """Called by main.py after startup to inject shared resources."""
    global _collection, _llm_client
    _collection = collection
    _llm_client = llm_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def retrieve(query: str, mystery_id: str, n_results: int = 1) -> list[dict]:
    """Query ChromaDB and return a list of matching case file dicts."""
    if not _collection:
        return []
    results = _collection.query(
        query_texts=[query],
        n_results=n_results,
        where={"mystery_id": mystery_id},
        include=["documents", "metadatas", "distances"],
    )
    docs = []
    if not results["ids"] or not results["ids"][0]:
        return docs
        
    for i, doc_id in enumerate(results["ids"][0]):
        docs.append(
            {
                "id": doc_id,
                "title": results["metadatas"][0][i]["title"],
                "category": results["metadatas"][0][i]["category"],
                "content": results["documents"][0][i],
            }
        )
    return docs


def call_llm(prompt: str) -> str:
    """Send a prompt to Ollama and return the response text."""
    if not _llm_client:
        return "LLM Client not initialized"
    response = _llm_client.chat.completions.create(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Endpoint A — Naive RAG (single-hop, fails to solve the mystery)
# ---------------------------------------------------------------------------

@router.get("/api/naive-rag")
async def naive_rag(
    query: str = Query(..., description="The mystery question"),
    mystery_id: str = Query(..., description="ID of the mystery")
):
    """Retrieves only the single most-similar document to the query."""
    if SIMULATION_MODE:
        if mystery_id not in MYSTERIES:
            raise HTTPException(status_code=400, detail="Custom mysteries require SIMULATION_MODE=false and Ollama running.")
        
        await asyncio.sleep(1.5)
        # Just grab the first document from the mystery for naive rag
        doc = MYSTERIES[mystery_id]["documents"][0]
        return {
            "query": query,
            "retrieved_document": doc,
            "answer": (
                "Based on the available information, I don't have enough "
                "context to determine the answer. A single document does not "
                "provide the full picture."
            ),
        }

    # Real mode
    docs = retrieve(query, mystery_id, n_results=1)
    doc = docs[0] if docs else {}

    prompt = (
        f"You are a detective. Based ONLY on this single clue, answer the question.\n\n"
        f"Question: {query}\n\n"
        f"Clue: {doc.get('content', '')}\n\n"
        f"If you cannot determine the answer from this clue alone, say so honestly."
    )
    answer = call_llm(prompt)
    return {"query": query, "retrieved_document": doc, "answer": answer}


# ---------------------------------------------------------------------------
# Endpoint B — Agentic RAG (multi-hop SSE stream)
# ---------------------------------------------------------------------------

async def _sim_stream(mystery_id: str) -> AsyncGenerator[str, None]:
    """Yield pre-scripted SSE events with artificial delay (simulation mode)."""
    mystery = MYSTERIES[mystery_id]
    
    # Map document IDs to full document dicts for easy lookup
    doc_map = {doc["id"]: doc for doc in mystery["documents"]}
    
    for step in mystery["sim_steps"]:
        await asyncio.sleep(1.8)
        
        # Hydrate the full document into the step payload
        doc = doc_map.get(step["document_id"], {})
        
        payload_step = {
            "step": step["step"],
            "type": step["type"],
            "query": step["query"],
            "document": doc,
            "reasoning": step["reasoning"],
            "next_query": step.get("next_query"),
            "answer": step.get("answer"),
        }
        
        payload = json.dumps(payload_step)
        yield f"data: {payload}\n\n"
    yield "data: [DONE]\n\n"


async def _real_stream(query: str, mystery_id: str) -> AsyncGenerator[str, None]:
    """Execute the real multi-hop agentic RAG loop and stream results."""
    current_query = query
    seen_ids: set[str] = set()
    accumulated_clues: list[str] = []

    for hop in range(1, MAX_HOPS + 2):  # allow up to MAX_HOPS+1 hops to reach verdict
        # 1. Retrieve
        docs = retrieve(current_query, mystery_id, n_results=1)
        doc = docs[0] if docs else {}
        doc_id = doc.get("id", "")

        # Avoid re-retrieving the same document
        if doc_id in seen_ids:
            # Try retrieving a second result
            docs2 = retrieve(current_query, mystery_id, n_results=2)
            for d in docs2:
                if d["id"] not in seen_ids:
                    doc = d
                    doc_id = d["id"]
                    break
        seen_ids.add(doc_id)
        if doc.get("content"):
            title = doc.get("title", "Unknown Source")
            accumulated_clues.append(f"- [{title}] {doc['content']}")
        all_clues_text = "\n".join(accumulated_clues)

        # 2. Ask the LLM
        prompt = (
            f"You are an investigative AI agent solving a mystery step by step.\n\n"
            f"Original question: {query}\n"
            f"Current search query: {current_query}\n"
            f"All clues gathered so far:\n{all_clues_text}\n\n"
            f"Based on ALL clues gathered so far, can you definitively name the specific person who is the answer to '{query}'?\n"
            f"You MUST provide the actual NAME or ROLE (e.g. 'The Butler', 'Alice', 'Arthur Vance') of the person. Describing them (e.g. 'the person who drove the car', 'the owner of the license plate') is NOT acceptable. If you do not know their actual name or role, you must output can_answer: false and issue a next_query to search for their identity.\n"
            f"Respond in JSON with this exact shape:\n"
            f'{{"can_answer": true|false, "reasoning": "...", '
            f'"next_query": "..." or null, "answer": "..." or null}}\n'
        )
        llm_response = call_llm(prompt)

        # Parse LLM JSON (defensive)
        try:
            import re
            match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            json_str = match.group(0) if match else llm_response
            parsed = json.loads(json_str)
        except Exception:
            # Fallback: extract fields heuristically
            parsed = {
                "can_answer": False,
                "reasoning": llm_response,
                "next_query": current_query + " more details",
                "answer": None,
            }

        can_answer: bool = parsed.get("can_answer", False)
        reasoning: str = parsed.get("reasoning", "")
        next_query: str | None = parsed.get("next_query")
        answer: str | None = parsed.get("answer")

        event_type = "verdict" if can_answer else "retrieve"

        payload = json.dumps(
            {
                "step": hop,
                "type": event_type,
                "query": current_query,
                "document": doc,
                "reasoning": reasoning,
                "next_query": next_query,
                "answer": answer,
            }
        )
        yield f"data: {payload}\n\n"

        if can_answer:
            break

        if next_query:
            current_query = next_query

    yield "data: [DONE]\n\n"


@router.get("/api/agentic-rag")
async def agentic_rag(
    query: str = Query(..., description="The mystery question"),
    mystery_id: str = Query(..., description="ID of the mystery")
):
    """Multi-hop agentic RAG streamed as SSE."""
    if SIMULATION_MODE:
        if mystery_id not in MYSTERIES:
            raise HTTPException(status_code=400, detail="Custom mysteries require SIMULATION_MODE=false and Ollama running.")
        stream = _sim_stream(mystery_id)
    else:
        stream = _real_stream(query, mystery_id)
        
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
