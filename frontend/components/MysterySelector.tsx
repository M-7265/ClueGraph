"use client";
// components/MysterySelector.tsx
// Dropdown/sidebar to select a mystery or trigger custom upload.

import { Mystery } from "@/lib/types";

interface MysterySelectorProps {
  mysteries: Mystery[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCustomClick: () => void;
  disabled: boolean;
}

export default function MysterySelector({ mysteries, selectedId, onSelect, onCustomClick, disabled }: MysterySelectorProps) {
  return (
    <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-2">
      <span className="text-slate-400 text-xs font-mono pl-2">Case File:</span>
      <select
        value={selectedId}
        onChange={(e) => {
          if (e.target.value === "custom_new") {
            onCustomClick();
          } else {
            onSelect(e.target.value);
          }
        }}
        disabled={disabled}
        className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-red-500 font-mono disabled:opacity-50 min-w-[200px]"
      >
        {mysteries.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
        {selectedId.startsWith("custom_") && selectedId !== "custom_new" && (
          <option value={selectedId}>Custom Mystery ({selectedId})</option>
        )}
        <option value="custom_new" className="text-amber-400 font-bold">
          + Upload Custom Case
        </option>
      </select>
    </div>
  );
}
