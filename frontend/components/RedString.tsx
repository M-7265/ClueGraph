"use client";
// components/RedString.tsx
// Absolutely-positioned SVG overlay that draws animated red "string" connections
// between ClueCard positions on the corkboard.
//
// Animation technique: stroke-dasharray = total path length, stroke-dashoffset
// animates from full length → 0 so the line "draws itself" in.

import { motion } from "framer-motion";

interface Point {
  x: number;
  y: number;
}

interface Connection {
  from: Point;
  to: Point;
  id: string;
}

interface RedStringProps {
  connections: Connection[];
  /** Width / height of the parent container (the corkboard) */
  width: number;
  height: number;
}

/** Compute a slightly curved cubic bezier path between two points */
function cubicPath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Control points: offset perpendicular to the line for a natural "sag"
  const cx1 = from.x + dx * 0.35 + dy * 0.12;
  const cy1 = from.y + dy * 0.35 - dx * 0.12;
  const cx2 = from.x + dx * 0.65 + dy * 0.12;
  const cy2 = from.y + dy * 0.65 - dx * 0.12;

  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}

/** Approximate path length for a cubic bezier (used for stroke-dasharray) */
function approxLength(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy) * 1.15; // slight multiplier for the curve
}

export default function RedString({ connections, width, height }: RedStringProps) {
  if (connections.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Subtle shadow filter so strings stand out from the board */}
        <filter id="string-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#7f1d1d" floodOpacity="0.7" />
        </filter>
      </defs>

      {connections.map(({ from, to, id }) => {
        const d = cubicPath(from, to);
        const len = approxLength(from, to);

        return (
          <g key={id} filter="url(#string-shadow)">
            {/* Background stroke (slightly thicker, darker) for depth */}
            <motion.path
              d={d}
              stroke="#7f1d1d"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            {/* Foreground red string */}
            <motion.path
              d={d}
              stroke="#ef4444"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={len}
              initial={{ strokeDashoffset: len, opacity: 0 }}
              animate={{ strokeDashoffset: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeInOut", delay: 0.05 }}
            />

            {/* Small dot at origin point */}
            <motion.circle
              cx={from.x}
              cy={from.y}
              r={3.5}
              fill="#ef4444"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
            {/* Small dot at destination */}
            <motion.circle
              cx={to.x}
              cy={to.y}
              r={3.5}
              fill="#ef4444"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.85 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export type { Connection, Point };
