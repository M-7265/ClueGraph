// lib/types.ts
// Shared TypeScript types for ClueGraph frontend.

export type StepType = "retrieve" | "verdict";

export interface CaseDocument {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface Mystery {
  id: string;
  title: string;
  description: string;
  query: string;
}

export interface CustomDocument {
  title: string;
  category: string;
  content: string;
}

export interface CustomMystery {
  title: string;
  description: string;
  query: string;
  documents: CustomDocument[];
}

export interface AgentStep {
  step: number;
  type: StepType;
  query: string;
  document: CaseDocument;
  reasoning: string;
  next_query: string | null;
  answer?: string | null;
}

export interface NaiveRagResult {
  query: string;
  retrieved_document: CaseDocument;
  answer: string;
}

export type AppPhase =
  | "idle"     // before any button press
  | "running"  // naive + agentic are executing
  | "done";    // all streams finished
