"use client";
// components/NaiveRagPanel.tsx
// Shows the Naive RAG result: one retrieved card + the failure answer.
// Uses a red "INSUFFICIENT" stamp overlay to hammer home the failure.

import { motion } from "framer-motion";
import { NaiveRagResult } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Evidence: "bg-red-700 text-red-100",
  Testimony: "bg-amber-700 text-amber-100",
  Records: "bg-blue-700 text-blue-100",
  "Physical Evidence": "bg-purple-700 text-purple-100",
};

interface NaiveRagPanelProps {
  result: NaiveRagResult | null;
  isLoading: boolean;
}

export default function NaiveRagPanel({ result, isLoading }: NaiveRagPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/40 border border-red-700/50 text-red-400 text-xs font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Naive RAG
        </span>
        <span className="text-slate-500 text-xs font-mono">— single hop, no reasoning</span>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex gap-2 items-center text-slate-500 font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-red-500"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            Retrieving single document…
          </motion.div>
        </div>
      )}

      {result && (
        <motion.div
          className="flex-1 flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Retrieved document card */}
          <div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-2">
              Retrieved (1 of 4 documents):
            </p>
            <div className="relative bg-stone-100 text-slate-800 rounded-sm p-4 border border-stone-300 shadow-lg shadow-black/40">
              {/* INSUFFICIENT stamp */}
              <motion.div
                initial={{ opacity: 0, scale: 1.4, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: -15 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-red-600 font-black text-2xl border-4 border-red-600 px-3 py-1 rounded opacity-70 uppercase tracking-widest select-none">
                  Insufficient
                </span>
              </motion.div>

              <span
                className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  CATEGORY_COLORS[result.retrieved_document.category] ?? "bg-slate-600 text-white"
                }`}
              >
                {result.retrieved_document.category}
              </span>
              <h3 className="font-bold text-sm font-mono mb-1">
                {result.retrieved_document.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {result.retrieved_document.content}
              </p>
            </div>
          </div>

          {/* LLM answer */}
          <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
              LLM Answer (with only 1 document):
            </p>
            <p className="text-slate-300 text-sm leading-relaxed font-mono">
              &ldquo;{result.answer}&rdquo;
            </p>
          </div>

          {/* Failure explanation */}
          <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3">
            <p className="text-red-400 text-[11px] font-mono leading-relaxed">
              <span className="font-bold">Why it fails:</span> Naive RAG retrieves only the{" "}
              <em>single most similar</em> document. Without iterative reasoning, it cannot
              chain clues across Police Report → Testimony → Toll Log → Receipt to identify
              the culprit.
            </p>
          </div>
        </motion.div>
      )}

      {!isLoading && !result && (
        <div className="flex-1 flex items-center justify-center text-slate-700 font-mono text-xs">
          Waiting to run…
        </div>
      )}
    </div>
  );
}
