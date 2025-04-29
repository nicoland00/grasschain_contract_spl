// src/context/tracking/contextLote.tsx
import React, { createContext, useContext, useState } from "react";

interface LoteContext {
  selectedLote: string | null;
  setSelectedLote: (s: string) => void;
}

const ctx = createContext<LoteContext>({
  selectedLote: null,
  setSelectedLote: () => {},
});

export function LoteProvider({ children }: { children: React.ReactNode }) {
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  return (
    <ctx.Provider value={{ selectedLote, setSelectedLote }}>
      {children}
    </ctx.Provider>
  );
}

export const useLote = () => useContext(ctx);
