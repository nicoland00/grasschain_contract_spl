// src/components/tracking/StatsPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";
import { useSession } from "next-auth/react";
import { useWallet }   from "@solana/wallet-adapter-react";

interface Animal {
  id:           string;
  name:         string;
  earTag?:      string;
  lastWeight?:  { weight: number; date: string };
}

interface ContractEntry {
  contractId: string;
  ranchId:    string;
  lotId?:     string;
  // you could add a "label" field if your backend returns farmName or lotName
}

export default function StatsPanel() {
  const { selected, setSelected } = useLote();
  const { data: session }         = useSession();
  const { publicKey, connected }  = useWallet();

  const [contracts, setContracts] = useState<ContractEntry[]>([]);
  const [animals, setAnimals]     = useState<Animal[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // 1️⃣ Load user's contracts once, so we can populate the Lote selector
  useEffect(() => {
    let url = "/api/my-contracts";
    if (!session?.user?.email) {
      if (connected && publicKey) {
        url += `?wallet=${publicKey.toBase58()}`;
      } else {
        return;
      }
    }
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((list: any[]) => {
        // ensure we only keep entries that have a lotId (for fiat) or some default for crypto
        const mapped: ContractEntry[] = list.map((c) => ({
          contractId: c.contractId,
          ranchId:    c.ranchId,
          lotId:      c.lotId, 
        }));
        setContracts(mapped);

        // if nothing selected yet, pick the first
        if (!selected && mapped.length && mapped[0].lotId) {
          setSelected({ ranchId: mapped[0].ranchId, lotId: mapped[0].lotId });
        }
      })
      .catch(console.error);
  }, [session, connected, publicKey, selected, setSelected]);

  // 2️⃣ Whenever selected changes, re-fetch the animals for that lot
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

  // If user hasn't even picked a contract yet
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
          {/* ──────────── Lote selector ──────────── */}
          {contracts.length > 1 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                Elige tu inversión:
              </label>
              <select
                value={`${selected.ranchId}|${selected.lotId}`}
                onChange={(e) => {
                  const [ranchId, lotId] = e.target.value.split("|");
                  setSelected({ ranchId, lotId });
                }}
                className="mt-1 block w-full border-gray-300 rounded-md"
              >
                {contracts.map((c) => (
                  <option key={c.contractId} value={`${c.ranchId}|${c.lotId}`}>
                    {/* You can replace this with a human-friendly label if you have one */}
                    {c.lotId ?? c.contractId}
                  </option>
                ))}
              </select>
            </div>
          )}
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
