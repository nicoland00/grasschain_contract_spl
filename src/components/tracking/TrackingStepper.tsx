import React from "react";

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

interface TrackingStepperProps {
  current: StageKey;
}

export function TrackingStepper({ current }: TrackingStepperProps) {
  const effectiveCurrent = current === "defaulted" ? "settled" : current;
  const currentIndex = STEP_ORDER.indexOf(effectiveCurrent);

  return (
    <section className="step-wizard">
      <ul className="step-wizard-list">
        {STEP_ORDER.map((step, idx) => {
          // decide the state for this step
          let stateClass = "ready";
          if (idx < currentIndex) stateClass = "done";
          else if (idx === currentIndex) stateClass = "wip";

          return (
            <li
              key={step}
              className={`step-wizard-item ${stateClass}`}
            >
              <span className="progress-count">{idx + 1}</span>
              <span className="progress-label">{step}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
