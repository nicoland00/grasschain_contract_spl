"use client";
import React, { useState, useRef, useEffect } from "react";
import { useNotifications, TNotification } from "@/hooks/useNotifications";

// ① Export the StageKey here
export type StageKey =
  | "bought"
  | "verification"
  | "active"
  | "settling"
  | "settled"
  | "defaulted";

const STEP_ORDER: StageKey[] = [
  "bought",
  "verification",
  "active",
  "settling",
  "settled",
];

interface Props {
  current:    StageKey;
  contractId: string;
}

export function TrackingStepper({ current, contractId }: Props) {
  const effective = current === "defaulted" ? "settled" : current;
  const idx       = STEP_ORDER.indexOf(effective);
  const [open, setOpen] = useState(false);
  const ref            = useRef<HTMLDivElement>(null);

  const { all: notes } = useNotifications(`?contract=${contractId}`);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <section className="step-wizard relative">
      <ul
        className="step-wizard-list cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {STEP_ORDER.map((step, i) => {
          let cls: "ready" | "done" | "wip" = "ready";
          if (i < idx) cls = "done";
          else if (i === idx) cls = "wip";
          return (
            <li key={step} className={`step-wizard-item ${cls}`}>
              <span className="progress-count">{i + 1}</span>
              <span className="progress-label">{step}</span>
            </li>
          );
        })}
      </ul>

      {open && (
        <div
          ref={ref}
          className="absolute right-0 mt-2 w-80 max-h-64 overflow-auto bg-white border rounded shadow-lg z-50"
        >
          <h4 className="px-4 py-2 border-b font-semibold">Updates</h4>
          {notes.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No updates</p>
          ) : (
            notes
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((n: TNotification) => (
                <div key={n._id} className="px-4 py-3 border-b last:border-b-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{n.title}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                </div>
              ))
          )}
        </div>
      )}
    </section>
  );
}
