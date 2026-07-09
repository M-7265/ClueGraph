"use client";
// components/ClueGraphBoard.tsx
// The main corkboard panel (70% of the layout).
// Manages card positions and computes RedString connection points.
// Cards are placed in a responsive grid; strings connect sequential cards.

import { useRef, useState, useLayoutEffect } from "react";
import { AgentStep } from "@/lib/types";
import ClueCard from "./ClueCard";
import RedString, { Connection, Point } from "./RedString";

interface ClueGraphBoardProps {
  steps: AgentStep[];
  verdict: string | null;
}

// Fixed card layout positions (as fractions of board dimensions)
// so connections are always predictable and look good at any size.
const CARD_POSITIONS: Array<{ xFrac: number; yFrac: number }> = [
  { xFrac: 0.08, yFrac: 0.08 },
  { xFrac: 0.55, yFrac: 0.06 },
  { xFrac: 0.10, yFrac: 0.50 },
  { xFrac: 0.56, yFrac: 0.50 },
];

const CARD_WIDTH = 224;  // w-56 = 14rem = 224px
const CARD_HEIGHT = 190; // approximate rendered height

/** Return the centre anchor point of a card given its top-left position */
function cardAnchor(pos: { x: number; y: number }): Point {
  return {
    x: pos.x + CARD_WIDTH / 2,
    y: pos.y + CARD_HEIGHT / 2,
  };
}

export default function ClueGraphBoard({ steps, verdict }: ClueGraphBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!boardRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setBoardSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = boardSize;

  // Compute absolute pixel positions for each card
  const cardPositions = CARD_POSITIONS.map((p) => ({
    x: p.xFrac * width,
    y: p.yFrac * height,
  }));

  // Build SVG connections between sequential cards
  const connections: Connection[] = [];
  for (let i = 1; i < steps.length; i++) {
    if (i >= cardPositions.length) break;
    connections.push({
      id: `conn-${i}`,
      from: cardAnchor(cardPositions[i - 1]),
      to: cardAnchor(cardPositions[i]),
    });
  }

  const isEmpty = steps.length === 0;

  return (
    <div
      ref={boardRef}
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{
        // Cork/wood texture via noise + warm tint
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(120,80,40,0.25) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(90,50,20,0.2) 0%, transparent 55%),
          #2d1f0e
        `,
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Subtle noise overlay for cork texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Board frame */}
      <div className="absolute inset-0 rounded-lg border-2 border-stone-700/60 pointer-events-none" />

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-stone-600 pointer-events-none">
          <svg className="w-16 h-16 opacity-40" fill="none" viewBox="0 0 64 64" stroke="currentColor">
            <rect x="8" y="8" width="48" height="48" rx="4" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="20" y1="28" x2="44" y2="28" strokeWidth="2" />
            <line x1="20" y1="36" x2="36" y2="36" strokeWidth="2" />
          </svg>
          <p className="text-sm font-mono tracking-widest uppercase opacity-60">
            Evidence board empty
          </p>
          <p className="text-xs opacity-40 font-mono">
            Run the agent to pin clues
          </p>
        </div>
      )}

      {/* RedString SVG layer (renders below cards visually via z-index) */}
      {width > 0 && (
        <RedString connections={connections} width={width} height={height} />
      )}

      {/* ClueCards */}
      {steps.map((step, i) => {
        if (i >= cardPositions.length) return null;
        const pos = cardPositions[i];
        return (
          <ClueCard
            key={step.document.id + "-" + i}
            doc={step.document}
            index={i}
            isVerdict={step.type === "verdict"}
            style={{ left: pos.x, top: pos.y }}
          />
        );
      })}

      {/* Verdict banner at the bottom */}
      {verdict && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pt-12">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔍</span>
            <div>
              <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-1 font-mono">
                Agent Verdict
              </p>
              <p className="text-stone-200 text-sm leading-relaxed font-mono">
                {verdict.replace("🔍 VERDICT: ", "")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
