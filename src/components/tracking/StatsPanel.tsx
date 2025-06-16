// src/components/tracking/StatsPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

interface Animal {
  id:           string;
  name:         string;
  earTag?:      string;
  lastWeight?:  { weight: number; date: string };
}

export default function StatsPanel() {
  const { selected } = useLote();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/animals/${selected.ranchId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const list = (json.data || []) as any[];
        const filtered = list
          .filter((a) => a.lot?.lotId === selected.lotId && a.lastWeight)
          .map((a) => ({
            id:         a.id,
            name:       a.name || a.earTag || "–",
            earTag:     a.earTag,
            lastWeight: a.lastWeight,
          }));
        setAnimals(filtered);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  // no contract → full‐screen message
  if (!selected) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
        <p className="text-lg font-medium">Por favor verifica primero tu contrato.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-white/80 pointer-events-auto">
      <div className="h-full max-w-3xl mx-auto flex flex-col bg-white rounded-lg shadow-lg">
        <header className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold">Estadísticas del lote</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {loading && <p>Cargando animales…</p>}
          {error   && <p className="text-red-600">Error: {error}</p>}
          {!loading && animals.length === 0 && (
            <p>No se encontraron animales para este lote.</p>
          )}

          {animals.length > 0 && (
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-1/3 border-b p-2 text-left">Nombre</th>
                  <th className="w-1/6 border-b p-2 text-left">EarTag</th>
                  <th className="w-1/6 border-b p-2 text-right">Peso (kg)</th>
                  <th className="w-1/3 border-b p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {animals.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="border-b p-2">{a.name}</td>
                    <td className="border-b p-2">{a.earTag || "–"}</td>
                    <td className="border-b p-2 text-right">
                      {a.lastWeight?.weight.toFixed(1) ?? "–"}
                    </td>
                    <td className="border-b p-2">
                      {a.lastWeight?.date.slice(0, 10) ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  );
}
