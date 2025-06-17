// components/tracking/StatsPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

type ContractEntry = {
  ranchId:    string;
  lotId:      string;
  label:      string; // e.g. the farmName or any display name you prefer
};

type Animal = {
  id:         string;
  name:       string;
  earTag?:    string;
  lastWeight?: { weight: number; date: string };
};

export default function StatsPanel() {
  const { selected, setSelected } = useLote();

  // ─── 1) Load all active contracts/lots ───
  const [lots, setLots]       = useState<ContractEntry[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [lotsError, setLotsError]     = useState<string | null>(null);

  useEffect(() => {
    setLotsLoading(true);
    fetch("/api/my-contracts")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((contracts: any[]) => {
        setLots(
          contracts.map((c) => ({
            ranchId: c.ranchId,
            lotId:   c.lotId,
            label:   c.farmName || c.lotName || c.lotId,
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        setLotsError(err.message);
      })
      .finally(() => setLotsLoading(false));
  }, []);

  // ─── 2) Stats fetch for the currently selected lot ───
  const [animals, setAnimals]     = useState<Animal[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]     = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setStatsLoading(true);
    fetch(`/api/animals/${selected.ranchId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setAnimals(
          (json.data || [])
            .filter((a: any) => a.lot?.lotId === selected.lotId)
            .map((a: any) => ({
              id:         a.id,
              name:       a.name || a.earTag || "–",
              earTag:     a.earTag,
              lastWeight: a.lastWeight,
            }))
        );
      })
      .catch((err) => {
        console.error(err);
        setStatsError(err.message);
      })
      .finally(() => setStatsLoading(false));
  }, [selected]);

  // ─── 3) Render ───
  // If user hasn’t verified/selected yet:
  if (!selected) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
        <p className="text-lg">Por favor verifica primero tu contrato.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 overflow-auto p-4 pointer-events-auto">
      <div className="max-w-3xl mx-auto bg-white/90 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Estadísticas del lote</h1>

        {/** ——— Lot selector ——— **/}
        {lotsLoading && <p>Cargando tus lotes…</p>}
        {lotsError   && <p className="text-red-600">{lotsError}</p>}
        {!lotsLoading && lots.length > 0 && (
          <div className="mb-6">
            <label htmlFor="lot-select" className="block font-medium mb-1">
              Selecciona un lote:
            </label>
            <select
              id="lot-select"
              className="w-full border rounded px-3 py-2"
              value={selected.lotId}
              onChange={(e) => {
                const lotId = e.target.value;
                const lot  = lots.find((l) => l.lotId === lotId);
                if (lot) {
                  setSelected({ ranchId: lot.ranchId, lotId: lot.lotId });
                }
              }}
            >
              {lots.map((l) => (
                <option key={l.lotId} value={l.lotId}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/** ——— Stats table ——— **/}
        {statsLoading && <p>Cargando animales…</p>}
        {statsError   && <p className="text-red-600">{statsError}</p>}
        {!statsLoading && animals.length === 0 && (
          <p>No hay animales en este lote.</p>
        )}
        {animals.length > 0 && (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Nombre</th>
                <th className="border p-2">EarTag</th>
                <th className="border p-2 text-right">Peso (kg)</th>
                <th className="border p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border p-2">{a.name}</td>
                  <td className="border p-2">{a.earTag || "–"}</td>
                  <td className="border p-2 text-right">
                    {a.lastWeight?.weight?.toFixed(1) || "–"}
                  </td>
                  <td className="border p-2">
                    {a.lastWeight?.date?.slice(0, 10) || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
