"use client";
// app/page.tsx
// Main ClueGraph page.
// Orchestrates the two-phase flow:
//   1. Naive RAG  → fetches and shows a single card with a failure stamp.
//   2. Agentic RAG → streams SSE, appending cards + terminal logs in real time.

import { useState, useCallback, useRef } from "react";
import { AgentStep, NaiveRagResult, AppPhase, Mystery, CustomMystery } from "@/lib/types";
import { fetchNaiveRag, streamAgenticRag, fetchMysteries, createCustomMystery } from "@/lib/api";
import AgentTerminal, { TerminalLine } from "@/components/AgentTerminal";
import ClueGraphBoard from "@/components/ClueGraphBoard";
import NaiveRagPanel from "@/components/NaiveRagPanel";
import QueryButton from "@/components/QueryButton";
import MysterySelector from "@/components/MysterySelector";
import CustomCaseUpload from "@/components/CustomCaseUpload";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";



let lineCounter = 0;
function makeLine(text: string, variant: TerminalLine["variant"] = "info"): TerminalLine {
  return { id: `line-${++lineCounter}`, text, variant };
}

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [naiveResult, setNaiveResult] = useState<NaiveRagResult | null>(null);
  const [naiveLoading, setNaiveLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<"naive" | "agentic">("naive");
  
  // Mysteries State
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [selectedMysteryId, setSelectedMysteryId] = useState<string>("diamond");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(true);

  // Fetch mysteries and health on mount
  useEffect(() => {
    fetchMysteries().then((data) => {
      setMysteries(data);
    }).catch(err => console.error("Failed to fetch mysteries", err));

    fetch((process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/health")
      .then(r => r.json())
      .then(d => setIsSimulationMode(d.simulation_mode))
      .catch(() => {});
  }, []);

  const currentMystery = mysteries.find(m => m.id === selectedMysteryId) || mysteries[0];
  const activeQuery = currentMystery?.query || "Unknown Question";

  const cleanupRef = useRef<(() => void) | null>(null);

  const appendLog = useCallback((text: string, variant: TerminalLine["variant"] = "info") => {
    setTerminalLines((prev) => [...prev, makeLine(text, variant)]);
  }, []);

  const resetState = useCallback(() => {
    // Abort any running stream
    cleanupRef.current?.();
    cleanupRef.current = null;

    setPhase("idle");
    setNaiveResult(null);
    setNaiveLoading(false);
    setAgentSteps([]);
    setTerminalLines([]);
    setVerdict(null);
    setIsStreaming(false);
    lineCounter = 0;
  }, []);

  const handleSolve = useCallback(async () => {
    if (phase === "running" || !currentMystery) return;
    if (phase === "done") {
      resetState();
      return;
    }

    setPhase("running");
    setActiveTab("naive");

    // ─── Phase 1: Naive RAG ──────────────────────────────────────────────────
    setNaiveLoading(true);
    appendLog(`Case: ${currentMystery.title}`, "system");
    appendLog(`Query: "${activeQuery}"`, "system");
    appendLog("Naive RAG: retrieving top-1 document…", "info");

    try {
      setNaiveResult(await fetchNaiveRag(activeQuery, selectedMysteryId));
      appendLog(`Naive RAG retrieved: document loaded`, "retrieve");
      appendLog("Naive RAG verdict: insufficient information.", "error");
    } catch (err) {
      appendLog(`Naive RAG error: ${(err as Error).message}`, "error");
    } finally {
      setNaiveLoading(false);
    }

    // Brief pause before starting agentic stream
    await new Promise((r) => setTimeout(r, 800));

    // ─── Phase 2: Agentic RAG (SSE) ──────────────────────────────────────────
    setActiveTab("agentic");
    setIsStreaming(true);
    appendLog("─".repeat(40), "system");
    appendLog("Agentic RAG: initialising multi-hop loop…", "system");
    appendLog(`Starting iteration 1 — query: "${activeQuery}"`, "info");

    const cleanup = streamAgenticRag(
      activeQuery,
      selectedMysteryId,
      // onStep
      (step: AgentStep) => {
        setAgentSteps((prev) => {
          // Avoid duplicate steps
          if (prev.find((s) => s.step === step.step)) return prev;
          return [...prev, step];
        });

        appendLog(`[Hop ${step.step}] Query: "${step.query}"`, "retrieve");
        appendLog(`[Hop ${step.step}] Retrieved: "${step.document.title}"`, "retrieve");
        appendLog(`[Hop ${step.step}] Reasoning: ${step.reasoning}`, "reason");

        if (step.type === "verdict" && step.answer) {
          setVerdict(step.answer);
          appendLog("─".repeat(40), "system");
          appendLog(`VERDICT: ${step.answer}`, "verdict");
        } else if (step.next_query) {
          appendLog(`[Hop ${step.step}] Next query → "${step.next_query}"`, "info");
        }
      },
      // onDone
      () => {
        setIsStreaming(false);
        setPhase("done");
        appendLog("Stream complete. Case closed.", "system");
        cleanupRef.current = null;
      },
      // onError
      (err: Error) => {
        setIsStreaming(false);
        setPhase("done");
        appendLog(`Stream error: ${err.message}`, "error");
        cleanupRef.current = null;
      }
    );

    cleanupRef.current = cleanup;
  }, [phase, appendLog, resetState, currentMystery, activeQuery, selectedMysteryId]);

  const buttonPhase =
    phase === "idle" ? "idle" : phase === "done" ? "done" : "running";

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕵️</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-mono text-white">
              Clue<span className="text-red-500">Graph</span>
            </h1>
            <p className="text-slate-500 text-[11px] font-mono uppercase tracking-widest">
              Naive RAG vs Multi-Hop Agentic RAG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <MysterySelector 
            mysteries={mysteries} 
            selectedId={selectedMysteryId} 
            onSelect={setSelectedMysteryId}
            onCustomClick={() => setIsUploadModalOpen(true)}
            disabled={buttonPhase === "running"}
          />
          <QueryButton onClick={handleSolve} phase={buttonPhase} />
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 min-h-0">

        {/* Left panel — Agent Terminal (30%) */}
        <div className="w-[30%] shrink-0 flex flex-col min-h-0">
          <AgentTerminal lines={terminalLines} isStreaming={isStreaming} />
        </div>

        {/* Right panel — split top/bottom (70%) */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">

          {/* Tab switcher */}
          <div className="shrink-0 flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 w-fit">
            {(["naive", "agentic"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-widest
                  transition-colors duration-200
                  ${
                    activeTab === tab
                      ? tab === "naive"
                        ? "bg-red-700 text-white"
                        : "bg-emerald-700 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }
                `}
              >
                {tab === "naive" ? "❌ Naive RAG" : "✅ Agentic RAG"}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              {activeTab === "naive" ? (
                <motion.div
                  key="naive"
                  className="absolute inset-0 overflow-y-auto p-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <NaiveRagPanel result={naiveResult} isLoading={naiveLoading} />
                </motion.div>
              ) : (
                <motion.div
                  key="agentic"
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ClueGraphBoard steps={agentSteps} verdict={verdict} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 px-6 py-2 border-t border-slate-800 text-slate-600 text-[10px] font-mono flex items-center justify-between">
        <span>ClueGraph — RAG demo · {isSimulationMode ? "SIMULATION_MODE=true (Pre-scripted)" : "SIMULATION_MODE=false (Ollama LLM)"}</span>
        <span>FastAPI + ChromaDB + Ollama · Next.js frontend</span>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CustomCaseUpload 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        isSimulationMode={isSimulationMode}
        onSubmit={async (customMystery) => {
          const res = await createCustomMystery(customMystery);
          if (res.error) throw new Error(res.error);
          
          const newMystery = {
            id: res.id,
            title: customMystery.title,
            description: customMystery.description,
            query: customMystery.query
          };
          
          setMysteries(prev => [...prev, newMystery]);
          setSelectedMysteryId(res.id);
        }}
      />
    </main>
  );
}
