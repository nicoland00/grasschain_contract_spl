// src/context/tracking/contextLote.tsx
import React from "react";

type SelectedLot = { ranchId: string; lotId: string } | null;

const LoteContext = React.createContext<{
  selected: SelectedLot;
  setSelected: (v: SelectedLot) => void;
}>({ selected: null, setSelected: () => {} });

export function LoteProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<SelectedLot>(null);
  return (
    <LoteContext.Provider value={{ selected, setSelected }}>
      {children}
    </LoteContext.Provider>
  );
}

export const useLote = () => React.useContext(LoteContext);
