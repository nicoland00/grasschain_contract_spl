"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";

interface Animal {
  id: string;
  name: string;
  earTag?: string;
  lastWeight?: { weight: number; date: string };
}

export default function StatsPage() {
  const { selected } = useLote();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    if (!selected?.ranchId || !selected.lotId) return;
    setLoading(true);
    fetch(`/api/animals/${selected.ranchId}`)
      .then(r => { if (!r.ok) throw Error(r.statusText); return r.json(); })
      .then(json => {
        setAnimals(
          (json.data||[])
            .filter((a:any)=>a.lot?.lotId===selected.lotId)
            .map((a:any)=>({
              id: a.id,
              name: a.name||a.earTag||"–",
              earTag: a.earTag,
              lastWeight: a.lastWeight,
            }))
        );
      })
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  }, [selected]);

  // if no selection, prompt
  if (!selected) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
        <p className="text-lg">Por favor verifica primero tu contrato.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 overflow-auto p-4 pl-20 pointer-events-auto">
      <div className="max-w-3xl mx-auto bg-white/90 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Estadísticas del lote</h1>
        {loading && <p>Cargando…</p>}
        {error   && <p className="text-red-600">{error}</p>}
        {!loading && animals.length===0 && <p>No hay animales en este lote.</p>}
        {animals.length>0 && (
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
              {animals.map(a=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border p-2">{a.name}</td>
                  <td className="border p-2">{a.earTag||"–"}</td>
                  <td className="border p-2 text-right">
                    {a.lastWeight?.weight.toFixed(1)||"–"}
                  </td>
                  <td className="border p-2">
                    {a.lastWeight?.date.slice(0,10)||"–"}
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
