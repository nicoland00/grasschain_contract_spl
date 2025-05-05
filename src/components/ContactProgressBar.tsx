// src/components/ContractProgressBar.tsx
import React from "react";

const STAGES = [
  { key: "bought",      label: "Bought" },
  { key: "verification",label: "Verification" },
  { key: "active",      label: "Active" },
  { key: "settling",    label: "Settling Window" },
  { key: "settled",     label: "Settled" },
] as const;
type StageKey = typeof STAGES[number]["key"];

export function ContractProgressBar({ current }: { current: StageKey }) {
  const idx = STAGES.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center">
      {STAGES.map((s, i) => (
        <React.Fragment key={s.key}>
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              i <= idx ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
            }`}
          />
          {i < STAGES.length - 1 && (
            <div
              className={`flex-1 h-px ${
                i < idx ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
      <span className="ml-4 font-medium">{STAGES[idx].label}</span>
    </div>
  );
}
