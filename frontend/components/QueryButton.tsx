"use client";
// components/QueryButton.tsx
// The primary CTA button with three states: idle, loading, done.

import { motion } from "framer-motion";

interface QueryButtonProps {
  onClick: () => void;
  phase: "idle" | "running" | "done";
  label?: string;
}

export default function QueryButton({ onClick, phase, label }: QueryButtonProps) {
  const isRunning = phase === "running";

  return (
    <motion.button
      onClick={onClick}
      disabled={isRunning}
      whileHover={!isRunning ? { scale: 1.03 } : {}}
      whileTap={!isRunning ? { scale: 0.97 } : {}}
      className={`
        relative overflow-hidden px-8 py-3 rounded-lg font-bold font-mono text-sm
        uppercase tracking-widest transition-colors duration-300 select-none
        ${
          isRunning
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : phase === "done"
            ? "bg-green-700 hover:bg-green-600 text-green-100 cursor-pointer"
            : "bg-red-700 hover:bg-red-600 text-white cursor-pointer shadow-lg shadow-red-900/50"
        }
      `}
    >
      {/* Shimmer sweep on idle */}
      {phase === "idle" && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          animate={{ translateX: ["−100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
      )}

      {/* Running: pulsing dots */}
      {isRunning ? (
        <span className="flex items-center gap-2">
          <motion.span
            className="w-2 h-2 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
          <span>Investigating…</span>
        </span>
      ) : (
        <span>{label ?? (phase === "done" ? "✓ Case Solved — Run Again" : "🔍 Solve the Mystery")}</span>
      )}
    </motion.button>
  );
}
