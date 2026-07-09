"use client";
// components/ClueCard.tsx
// A physical-looking "case file" card that animates onto the corkboard.
// Uses Framer Motion: scale up from 0.8, fade in, with a slight random rotation.

import { motion } from "framer-motion";
import { CaseDocument } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Evidence: "bg-red-700 text-red-100",
  Testimony: "bg-amber-700 text-amber-100",
  Records: "bg-blue-700 text-blue-100",
  "Physical Evidence": "bg-purple-700 text-purple-100",
};

interface ClueCardProps {
  doc: CaseDocument;
  /** Index in the sequence (used to vary the rotation) */
  index: number;
  /** Whether this is the verdict card */
  isVerdict?: boolean;
  style?: React.CSSProperties;
}

export default function ClueCard({
  doc,
  index,
  isVerdict = false,
  style,
}: ClueCardProps) {
  // Alternate slight tilt directions for a realistic pinned-card feel
  const rotation = index % 2 === 0 ? -1.8 : 1.5;
  const badgeClass =
    CATEGORY_COLORS[doc.category] ?? "bg-slate-600 text-slate-100";

  return (
    <motion.div
      initial={{ scale: 0.75, opacity: 0, rotate: rotation - 2 }}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
      style={style}
      className={`
        absolute w-56 cursor-default select-none
        bg-stone-100 text-slate-800
        rounded-sm shadow-2xl shadow-black/60
        border border-stone-300
        ${isVerdict ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900" : ""}
      `}
    >
      {/* Thumbtack / pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="w-4 h-4 rounded-full bg-red-600 shadow-md shadow-black/50 border border-red-800" />
      </div>

      {/* Aged paper texture via a repeating gradient */}
      <div
        className="absolute inset-0 rounded-sm opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 24px, #78716c 24px, #78716c 25px)",
        }}
      />

      <div className="relative p-4 pt-5">
        {/* Category badge */}
        <span
          className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest mb-2 ${badgeClass}`}
        >
          {doc.category}
        </span>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-900 leading-tight mb-2 font-mono">
          {doc.title}
        </h3>

        {/* Divider — looks like a rule on a notepad */}
        <div className="border-t border-stone-400 mb-2" />

        {/* Content */}
        <p className="text-xs leading-relaxed text-slate-700 line-clamp-5">
          {doc.content}
        </p>

        {isVerdict && (
          <div className="mt-3 pt-2 border-t border-amber-400">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
              ★ Key Evidence
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
