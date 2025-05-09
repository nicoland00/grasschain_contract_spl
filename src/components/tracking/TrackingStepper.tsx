// src/components/tracking/TrackingStepper.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNotifications, TNotification } from "@/hooks/useNotifications";

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
  current: StageKey;
  contractId: string;
}

export function TrackingStepper({ current, contractId }: Props) {
  // normalize
  const effective = current === "defaulted" ? "settled" : current;
  const idx = STEP_ORDER.indexOf(effective);

  // fetch all notifications for this contract
  const { all: notes } = useNotifications(`?contract=${contractId}`);

  // modal open state
  const [modalOpen, setModalOpen] = useState(false);

  // track which IDs the user has already seen
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const hasUnseen = notes.some((n) => !seen.has(n._id));

  // when opening modal, mark everything as seen
  useEffect(() => {
    if (modalOpen) {
      setSeen(new Set(notes.map((n) => n._id)));
    }
  }, [modalOpen, notes]);

  return (
    <>
      <section className="step-wizard relative overflow-visible pb-8">
        {/* 1) Step circles */}
        <ul className="step-wizard-list mb-4">
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

        {/* 2) Show updates button */}
        <div className="flex justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="relative w-3/4 md:w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Show updates
            {hasUnseen && (
              <span
                className="absolute top-2 right-4 block w-3 h-3 bg-red-500 rounded-full"
                aria-label="New updates"
              />
            )}
          </button>
        </div>
      </section>

      {/* 3) Modal via portal */}
      {modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg overflow-hidden max-w-lg w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <h2 className="text-lg font-semibold">Updates</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* content */}
              <div className="overflow-y-auto p-4 space-y-4">
                {notes.length === 0 ? (
                  <p className="text-center text-gray-500">No updates yet</p>
                ) : (
                  notes
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((n: TNotification) => (
                      <div key={n._id} className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="font-medium">{n.title}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{n.message}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
