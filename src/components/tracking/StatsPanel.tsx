// components/tracking/StatsPanel.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";
import LotSelector from "./lotSelector";

export default function StatsPanel() {

  const { selected } = useLote();
  // 2️⃣ stats data for the current selection
  const [animals, setAnimals] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats]     = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setLoadingStats(true);
    fetch(`/api/lots/${selected.ranchId}/${selected.lotId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setAnimals(
          (json.data || [])
            .filter((a: any) => a.lot?.lotId === selected.lotId)
            .map((a: any) => ({
              id: a.id,
              name: a.name || a.earTag || "–",
              earTag: a.earTag,
              weight: a.lastWeight?.weight ?? null,
              date: a.lastWeight?.date?.slice(0, 10) ?? "–",
            }))
        );
      })
      .catch((err) => setErrorStats(err.message))
      .finally(() => setLoadingStats(false));
  }, [selected]);

  // 3️⃣ render
  return (
    <div className="fixed inset-0 z-20 overflow-auto pt-20 px-4 pointer-events-auto" >
      <div className="max-w-3xl mx-auto bg-white/90 rounded-3xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 pl-8">Estadísticas del lote</h1>

        {/* ——— lot selector ——— */}
        <LotSelector className="mb-6" />
        {/* ——— stats table ——— */}
        {loadingStats && <p>Cargando animales…</p>}
        {errorStats && <p className="text-red-600">{errorStats}</p>}
        {!loadingStats && animals.length === 0 && <p>No hay animales en este lote.</p>}
        {animals.length > 0 && (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Nombre</th>
                <th className="border p-2 text-right">Peso (kg)</th>
                <th className="border p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border p-2">{a.name}</td>
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
