// src/components/NotificationsList.tsx
import React from "react";
import { useNotifications, TNotification } from "@/hooks/useNotifications";

const LABELS: Record<TNotification["stage"], string> = {
  bought:       "Bought",
  verification: "Verification Process",
  active:       "Active",
  settling:     "Settling Window",
  settled:      "Settled",
  defaulted:    "Defaulted",
};

export function NotificationsList({
  contractId,
}: {
  contractId: string;
}) {
  const { notifications, isLoading } = useNotifications(contractId);

  if (isLoading) return <p>Loading updates…</p>;
  if (notifications.length === 0) return <p>No updates yet.</p>;

  // group them by stage
  const byStage = notifications.reduce(
    (acc, n) => {
      (acc[n.stage] ||= []).push(n);
      return acc;
    },
    {} as Record<TNotification["stage"], TNotification[]>
  );

  return (
    <div className="space-y-6">
      {(Object.keys(LABELS) as TNotification["stage"][]).map((stage) =>
        (byStage[stage] ?? []).length > 0 ? (
          <div key={stage}>
            <h4 className="font-semibold">{LABELS[stage]}</h4>
            <ul className="list-disc pl-5">
              {byStage[stage]!.map((n) => (
                <li key={n._id}>{n.message}</li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}
