// components/tracking/StatsPanel.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

type ContractEntry = {
  contractId: string;
  ranchId:    string;
  lotId:      string;
  label:      string; // e.g. "San Antonio #1"
};

export default function StatsPanel() {
  const { selected, setSelected } = useLote();

  // 1️⃣ load all active contracts (with ranchId+lotId)
  const [contracts, setContracts] = useState<ContractEntry[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [errorContracts, setErrorContracts] = useState<string | null>(null);

  useEffect(() => {
    setLoadingContracts(true);
    fetch("/api/my-contracts")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((list: any[]) => {
        // assume API returns items { contractId, ranchId, lotId, farmName }
        setContracts(
          list.map((c) => ({
            contractId: c.contractId,
            ranchId:    c.ranchId,
            lotId:      c.lotId,
            label:      c.farmName, 
          }))
        );
      })
      .catch((err) => setErrorContracts(err.message))
      .finally(() => setLoadingContracts(false));
  }, []);

  // 2️⃣ stats data for the current selection
  const [animals, setAnimals] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats]     = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setLoadingStats(true);
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
              id:     a.id,
              name:   a.name || a.earTag || "–",
              earTag: a.earTag,
              weight: a.lastWeight?.weight ?? null,
              date:   a.lastWeight?.date?.slice(0, 10) ?? "–",
            }))
        );
      })
      .catch((err) => setErrorStats(err.message))
      .finally(() => setLoadingStats(false));
  }, [selected]);

  // 3️⃣ render
  return (
    <div className="absolute inset-0 z-10 overflow-auto p-4 pointer-events-auto">
      <div className="max-w-3xl mx-auto bg-white/90 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Estadísticas del lote</h1>

        {/* ——— lot selector ——— */}
        {loadingContracts && <p>Cargando contratos…</p>}
        {errorContracts && <p className="text-red-600">{errorContracts}</p>}
        {!loadingContracts && contracts.length > 0 && (
          <div className="mb-6">
            <label className="block font-medium mb-1" htmlFor="lot-select">
              Elige un lote:
            </label>
            <select
              id="lot-select"
              className="w-full border rounded px-3 py-2"
              value={selected?.lotId || ""}
              onChange={(e) => {
                const lotId = e.target.value;
                const c = contracts.find((c) => c.lotId === lotId);
                if (c) {
                  setSelected({ ranchId: c.ranchId, lotId: c.lotId });
                }
              }}
            >
              <option value="" disabled>
                — Selecciona un lote —
              </option>
              {contracts.map((c) => (
                <option key={c.lotId} value={c.lotId}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ——— stats table ——— */}
        {loadingStats && <p>Cargando animales…</p>}
        {errorStats && <p className="text-red-600">{errorStats}</p>}
        {!loadingStats && animals.length === 0 && <p>No hay animales en este lote.</p>}
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
                    {a.weight != null ? a.weight.toFixed(1) : "–"}
                  </td>
                  <td className="border p-2">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
