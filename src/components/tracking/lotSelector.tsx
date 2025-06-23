"use client";

import React, { useEffect, useState } from "react";
import { useLote } from "@/context/tracking/contextLote";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";

export type ContractEntry = {
  contractId: string;
  ranchId: string;
  lotId: string;
  farmName?: string;
  label: string;
};

export default function LotSelector({ className, onSelect }: { className?: string; onSelect?: () => void }) {
  const { selected, setSelected } = useLote();
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();

  const [lots, setLots] = useState<ContractEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!session?.user?.email && !(connected && publicKey)) {
        setError("Conecta tu wallet o inicia sesión");
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = session?.user?.email
        ? "/api/my-contracts"
        : `/api/my-contracts?wallet=${publicKey!.toBase58()}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const contracts: any[] = await res.json();
        setLots(
          contracts.map((c) => ({
            contractId: c.contractId,
            ranchId:    c.ranchId,
            lotId:      c.lotId,
            farmName:   c.farmName,
            label:      c.farmName || c.lotName || c.lotId || c.contractId,
          }))
        );
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, connected, publicKey]);

  if (loading) return <p className={className}>Cargando lotes…</p>;
  if (error) return <p className={className + " text-red-600"}>{error}</p>;
  if (lots.length === 0) return <p className={className}>No hay lotes.</p>;

  return (
    <div className={className}>
      <label htmlFor="lot-select" className="block font-medium mb-1">
        Selecciona un lote:
      </label>
      <select
        id="lot-select"
        className="w-full border rounded px-3 py-2"
        value={selected?.lotId || ""}
        onChange={(e) => {
          const lotId = e.target.value;
          const lot = lots.find((l) => l.lotId === lotId);
          if (lot) {
            setSelected({ ranchId: lot.ranchId, lotId: lot.lotId, contractId: lot.contractId });
            onSelect?.();
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
  );
}