// src/app/stats/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

interface Animal {
  id:           string;
  name:         string;
  earTag?:      string;
  lot?:         { lotId: string; name: string };
  lastWeight?:  { weight: number; date: string };
}

export default function StatsPage() {
  const { selected } = useLote();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/animals/${selected.ranchId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const list: Animal[] = (json.data ?? []).filter(
          (a: Animal) => a.lot?.lotId === selected.lotId
        );
        setAnimals(list);
      })
      .catch((err) => {
        console.error("Stats fetch error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selected]);

  if (!selected) {
    return (
      <div className="p-8 text-center text-gray-600">
        Por favor verifica primero tu contrato para seleccionar un lote.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Estadísticas del lote</h1>

      {loading && <p>Cargando animales…</p>}
      {error   && <p className="text-red-600">Error: {error}</p>}

      {!loading && animals.length === 0 && (
        <p>No se encontraron animales para este lote.</p>
      )}

      {animals.length > 0 && (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Nombre</th>
              <th className="border p-2 text-left">EarTag</th>
              <th className="border p-2 text-right">Último Peso (kg)</th>
              <th className="border p-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="border p-2">{a.name || "–"}</td>
                <td className="border p-2">{a.earTag || "–"}</td>
                <td className="border p-2 text-right">
                  {a.lastWeight?.weight?.toFixed(1) ?? "–"}
                </td>
                <td className="border p-2">
                  {a.lastWeight?.date?.slice(0,10) ?? "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
