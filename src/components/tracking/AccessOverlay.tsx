// src/components/tracking/AccessOverlay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { useLote } from "@/context/tracking/contextLote";
import { useGrasschainContractSplProgram } from "@/components/grasschain_contract_spl/grasschain_contract_spl-data-access";
import { PublicKey } from "@solana/web3.js";

export type ContractEntry = {
  contractId: string;
  ranchId?: string;
  lotId?: string;
  status: "not-started" | "active" | "settled" | "defaulted";
  farmName?: string;
};

const OVERLAY_Z = 40;

export default function AccessOverlay() {
  const { email, address } = useAuthIdentity();
  const { setSelected, selected } = useLote();

  const [contracts, setContracts] = useState<ContractEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { program } = useGrasschainContractSplProgram();
  const [metaMap, setMetaMap] = useState<Record<string, { farmName: string; farmImageUrl: string }>>({});

  useEffect(() => {
    async function load() {
      if (!email && !address) return;
      setLoading(true);
      try {
        const res = await fetch("/api/my-contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, address }),
        });
        const data: ContractEntry[] = await res.json();
        setContracts(data);
      } catch {
        setMessage("Error loading your contracts.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [email, address]);

  useEffect(() => {
    if (!contracts || !program) return;
    contracts.forEach(async (c) => {
      if (metaMap[c.contractId]) return;
      try {
        const acc = await program.account.contract.fetch(new PublicKey(c.contractId));
        setMetaMap((m) => ({
          ...m,
          [c.contractId]: { farmName: acc.farmName, farmImageUrl: acc.farmImageUrl },
        }));
      } catch {
        console.warn("couldn't fetch on-chain metadata for", c.contractId);
      }
    });
  }, [contracts, program, metaMap]);

  async function handleVerify(entry: ContractEntry) {
    if (entry.status !== "active") {
      setMessage(
        entry.status === "not-started"
          ? "Contract not active yet."
          : "This contract is already closed."
      );
      return;
    }
    setVerifyingId(entry.contractId);
    setMessage(null);
    try {
      const res = await fetch("/api/verify-nfts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract: entry.contractId, lotId: entry.lotId, email, address }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelected({ ranchId: data.ranchId, lotId: data.lotId, contractId: entry.contractId });
        return;
      } else {
        setMessage(data.reason || "Verification failed.");
      }
    } catch {
      setMessage("Verification error.");
    } finally {
      setVerifyingId(null);
    }
  }

  if (selected) return null;

  const active = contracts?.filter((c) => c.status === "active") ?? [];
  const others = contracts?.filter((c) => c.status !== "active") ?? [];

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-white"
      style={{ zIndex: OVERLAY_Z, background: "rgba(255,255,255,0.95)" }}
    >
      <motion.div
        className="sticky top-16 w-full bg-white/95 py-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-center">Select Herd to Visualize</h1>
        {message && <p className="mt-4 text-center text-red-600">{message}</p>}
      </motion.div>

      <div className="w-full max-w-3xl mt-8 space-y-8  mx-4 md:mx-auto">
        {active.map((c) => {
          const meta = metaMap[c.contractId] || {
            farmName: c.farmName || c.contractId,
            farmImageUrl: "/cows.gif",
          };
          return (
            <div key={c.contractId} className="space-y-4 px-6 py-6">
              <ContractCard
                entry={c}
                meta={meta}
                verifyingId={verifyingId}
                onVerify={() => handleVerify(c)}
              />
            </div>
          );
        })}

        {others.length > 0 && (
          <>
            <hr className="border-border" />
            {others.map((c) => {
              const meta = metaMap[c.contractId] || {
                farmName: c.farmName || c.contractId,
                farmImageUrl: "/cows.gif",
              };
              return (
                <div key={c.contractId} className="space-y-4 px-6">
                  <ContractCard
                    entry={c}
                    meta={meta}
                    verifyingId={verifyingId}
                    onVerify={() => handleVerify(c)}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function ContractCard({ entry, meta, verifyingId, onVerify }: { entry: ContractEntry; meta: { farmName: string; farmImageUrl: string }; verifyingId: string | null; onVerify: () => void; }) {
  return (
    <div className="rounded-xl shadow-lg overflow-hidden bg-white">
      <Image
        src={meta.farmImageUrl}
        alt={meta.farmName}
        width={800}
        height={400}
        className="object-cover w-full h-48"
      />
      <div className="p-4 flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{meta.farmName}</h2>
        <button
          className="btn btn-primary"
          disabled={verifyingId === entry.contractId}
          onClick={onVerify}
        >
          {verifyingId === entry.contractId ? "Verifying…" : "Verify Access"}
        </button>
      </div>
    </div>
  );
}
