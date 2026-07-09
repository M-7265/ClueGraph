// lib/api.ts
// API client for ClueGraph. Handles both the simple fetch (Naive RAG)
// and the SSE stream (Agentic RAG).

import { AgentStep, NaiveRagResult, Mystery, CustomMystery } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchMysteries(): Promise<Mystery[]> {
  const res = await fetch(`${API_BASE}/api/mysteries`);
  if (!res.ok) throw new Error(`Failed to fetch mysteries: ${res.status}`);
  return res.json();
}

export async function createCustomMystery(mystery: CustomMystery): Promise<{ id: string; status: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/mysteries/custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mystery)
  });
  return res.json();
}

/**
 * Fetch a single Naive RAG result. Returns the JSON payload directly.
 */
export async function fetchNaiveRag(
  query: string,
  mysteryId: string
): Promise<NaiveRagResult> {
  const res = await fetch(
    `${API_BASE}/api/naive-rag?query=${encodeURIComponent(query)}&mystery_id=${encodeURIComponent(mysteryId)}`
  );
  if (!res.ok) throw new Error(`Naive RAG request failed: ${res.status}`);
  return res.json();
}

/**
 * Stream agentic RAG steps via SSE.
 *
 * @param query        The mystery question.
 * @param onStep       Called with each parsed AgentStep as it arrives.
 * @param onDone       Called when the stream closes (signal "[DONE]").
 * @param onError      Called on connection or parse errors.
 *
 * @returns A cleanup function that closes the EventSource.
 */
export function streamAgenticRag(
  query: string,
  mysteryId: string,
  onStep: (step: AgentStep) => void,
  onDone: () => void,
  onError: (err: Error) => void
): () => void {
  const url = `${API_BASE}/api/agentic-rag?query=${encodeURIComponent(query)}&mystery_id=${encodeURIComponent(mysteryId)}`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    const raw: string = event.data;

    if (raw === "[DONE]") {
      es.close();
      onDone();
      return;
    }

    try {
      const step: AgentStep = JSON.parse(raw);
      onStep(step);
    } catch {
      onError(new Error(`Failed to parse SSE payload: ${raw}`));
    }
  };

  es.onerror = () => {
    es.close();
    onError(new Error("SSE connection error. Is the backend running?"));
  };

  // Return a cleanup function the caller can use to abort early.
  return () => es.close();
}
