// src/components/tracking/AccessOverlay.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLote } from "@/context/tracking/contextLote";
import { useGrasschainContractSplProgram } from "@/components/grasschain_contract_spl/grasschain_contract_spl-data-access";
import { PublicKey } from "@solana/web3.js";

type ContractEntry = {
  contractId: string;
  ranchId?: string;
  status: "not-started" | "active" | "settled" | "defaulted";
};

const OVERLAY_Z = 40;

export default function AccessOverlay() {
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();
  const { setSelectedLote, selectedLote } = useLote();

  const [contracts, setContracts] = useState<ContractEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // on-chain metadata
  const { program } = useGrasschainContractSplProgram();
  const [metaMap, setMetaMap] = useState<Record<string, { farmName: string; farmImageUrl: string }>>({});

  // 1) load your contracts (fiat or crypto)
  useEffect(() => {
    async function load() {
      if (!session?.user?.email && !(connected && publicKey)) return;
      setLoading(true);
      const url = session?.user?.email
        ? `/api/my-contracts`
        : `/api/my-contracts?wallet=${publicKey!.toBase58()}`;
      try {
        const res = await fetch(url);
        const data: ContractEntry[] = await res.json();
        setContracts(data);
      } catch {
        setMessage("Error loading your contracts.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session, connected, publicKey]);

  // 2) fetch on-chain farmName & farmImageUrl for each contract
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

  // 3) verify handler
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

    const payload: any = { contractId: entry.contractId };
    if (session?.user?.email) payload.email = session.user.email;
    else if (publicKey) payload.wallet = publicKey.toBase58();

    try {
      const res = await fetch("/api/verify-nfts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedLote(data.ranchId);
        return;
      } else {
        setMessage(data.error || "Verification failed.");
      }
    } catch {
      setMessage("Verification error.");
    } finally {
      setVerifyingId(null);
    }
  }

  // once a lote is selected, hide overlay
  if (selectedLote) return null;

  // split active vs others
  const active = contracts?.filter((c) => c.status === "active") ?? [];
  const others = contracts?.filter((c) => c.status !== "active") ?? [];

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center p-4 overflow-auto"
      style={{
        zIndex: OVERLAY_Z,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Sticky header */}
      <motion.div
        className="sticky top-16 w-full bg-white/95 py-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-center">Select Cattle Herd to Visualize</h1>
        {message && <p className="mt-4 text-center text-red-600">{message}</p>}
      </motion.div>

      <div className="w-full max-w-3xl mt-16 space-y-8">
        {/* Active contracts first */}
        {active.map((c) => {
          const meta = metaMap[c.contractId] || { farmName: c.contractId, farmImageUrl: "/cows.gif" };
          return (
            <ContractCard
              key={c.contractId}
              entry={c}
              meta={meta}
              verifyingId={verifyingId}
              onVerify={() => handleVerify(c)}
              session={session}
            />
          );
        })}

        {/* Divider & inactive */}
        {others.length > 0 && (
          <>
            <hr className="border-gray-300" />
            {others.map((c) => {
              const meta = metaMap[c.contractId] || { farmName: c.contractId, farmImageUrl: "/cows.gif" };
              return (
                <ContractCard
                  key={c.contractId}
                  entry={c}
                  meta={meta}
                  verifyingId={verifyingId}
                  onVerify={() => handleVerify(c)}
                  session={session}
                />
              );
            })}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// A little helper component to keep things DRY
function ContractCard({
  entry,
  meta,
  verifyingId,
  onVerify,
  session,
}: {
  entry: ContractEntry;
  meta: { farmName: string; farmImageUrl: string };
  verifyingId: string | null;
  onVerify: () => void;
  session: any;
}) {
  const isActive = entry.status === "active";
  const isVerifying = verifyingId === entry.contractId;

  return (
    <div className={`flex flex-col md:flex-row bg-white rounded-lg shadow overflow-hidden ${!isActive && "opacity-50"}`}>
      {/* left: 50% image */}
      <div className="w-full md:w-1/2 aspect-video relative">
        <Image src={meta.farmImageUrl} alt={meta.farmName} fill className="object-cover" />
      </div>
      {/* right: details & button */}
      <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
        <h2 className="text-2xl font-semibold mb-2">{meta.farmName}</h2>
        <div className="text-sm text-gray-600 space-y-1 mb-4">
          <div>
            <strong>Contract #:</strong> {entry.contractId}
          </div>
          <div>
            <strong>Verify Method:</strong>{" "}
            {session?.user?.email ? "Google Verification" : "NFT Verification"}
          </div>
        </div>
        <button
          onClick={onVerify}
          disabled={!isActive || isVerifying}
          className={`w-full py-3 rounded-lg text-white font-medium
            ${isActive
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-300 cursor-not-allowed"}`}
        >
          {!isActive
            ? entry.status === "not-started"
              ? "Not active"
              : "Closed"
            : isVerifying
            ? "Verifying…"
            : "Verify"}
        </button>
      </div>
    </div>
  );
}
