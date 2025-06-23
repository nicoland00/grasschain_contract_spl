// src/context/tracking/contextLote.tsx
import React, { useEffect } from "react";

type SelectedLot = { ranchId: string; lotId: string; contractId: string } | null;

const LoteContext = React.createContext<{
  selected: SelectedLot;
  setSelected: (v: SelectedLot) => void;
}>({ selected: null, setSelected: () => {} });

export function LoteProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<SelectedLot>(null);

  // Load the persisted selection on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("selectedLot");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ranchId && parsed?.lotId) {
          setSelected({ ranchId: parsed.ranchId, lotId: parsed.lotId, contractId: parsed.contractId });
        }
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Persist the selection so the overlay stays hidden
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selected) {
      window.localStorage.setItem("selectedLot", JSON.stringify(selected));
    } else {
      window.localStorage.removeItem("selectedLot");
    }
  }, [selected]);

  return (
    <LoteContext.Provider value={{ selected, setSelected }}>
      {children}
    </LoteContext.Provider>
  );
}

export const useLote = () => React.useContext(LoteContext);
