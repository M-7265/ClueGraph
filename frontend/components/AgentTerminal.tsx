"use client";
// components/AgentTerminal.tsx
// Left panel: a hacker-style terminal that types out SSE log lines in real time.
// Each line fades + slides in; a blinking cursor follows the last line.

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TerminalLine {
  id: string;
  text: string;
  /** Controls text colour */
  variant?: "info" | "retrieve" | "reason" | "verdict" | "error" | "system";
}

interface AgentTerminalProps {
  lines: TerminalLine[];
  isStreaming: boolean;
}

const VARIANT_STYLES: Record<string, string> = {
  info: "text-slate-400",
  retrieve: "text-cyan-400",
  reason: "text-amber-300",
  verdict: "text-green-400 font-bold",
  error: "text-red-400",
  system: "text-slate-500 italic",
};

export default function AgentTerminal({ lines, isStreaming }: AgentTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new lines arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-700 overflow-hidden font-mono text-xs">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700 shrink-0">
        <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-900" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-900" />
        <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-900" />
        <span className="ml-3 text-slate-400 text-[11px] tracking-widest uppercase select-none">
          Agent Terminal — ClueGraph
        </span>
      </div>

      {/* Scrollable log area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`leading-relaxed break-words ${
                VARIANT_STYLES[line.variant ?? "info"]
              }`}
            >
              <span className="text-slate-600 mr-2 select-none">›</span>
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor — only visible while streaming */}
        {isStreaming && (
          <motion.div
            className="flex items-center gap-1 text-slate-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-slate-600 mr-2">›</span>
            <motion.span
              className="inline-block w-2 h-4 bg-slate-400 rounded-sm"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-4 py-1.5 bg-slate-800 border-t border-slate-700 flex items-center gap-2">
        <motion.span
          className={`w-2 h-2 rounded-full ${isStreaming ? "bg-green-500" : "bg-slate-600"}`}
          animate={isStreaming ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <span className="text-slate-500 text-[10px] uppercase tracking-widest">
          {isStreaming ? "Streaming…" : lines.length === 0 ? "Standby" : "Complete"}
        </span>
        <span className="ml-auto text-slate-600 text-[10px]">
          {lines.length} log{lines.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
