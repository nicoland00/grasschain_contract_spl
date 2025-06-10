// src/app/tracking/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useSession }    from "next-auth/react";
import { useWallet }     from "@solana/wallet-adapter-react";

// import both from the same module:
import { TrackingStepper, StageKey } from "@/components/tracking/TrackingStepper";

export const dynamic = "force-dynamic";

export default function TrackingPage() {
  const { data: session, status: authStatus } = useSession();
  const { publicKey, connected }              = useWallet();
  const [stage, setStage]                     = useState<StageKey | "loading" | "no-contracts" | "not-started">("loading");
  const [sel, setSel]                         = useState<string>("");

  useEffect(() => {
    async function load() {
      if (authStatus === "loading") return;
      let url = `/api/my-contracts`;
      if (!session?.user?.email) {
        if (connected && publicKey) {
          url += `?wallet=${publicKey.toBase58()}`;
        } else {
          return setStage("no-contracts");
        }
      }

      let res: Response;
      try {
        res = await fetch(url);
      } catch {
        return setStage("no-contracts");
      }
      if (!res.ok) return setStage("no-contracts");
      const list: { contractId: string; status: StageKey }[] = await res.json();

      if (list.length === 0) return setStage("no-contracts");
      const active = list.find((c) => c.status === "active");
      if (!active) return setStage("not-started");

      setSel(active.contractId);
      setStage(active.status);
    }
    load();
  }, [session, authStatus, connected, publicKey]);

  if (stage === "loading")
    return <p className="text-center mt-20">Verifying…</p>;
  if (stage === "no-contracts")
    return <p className="text-center mt-20">No contracts found.</p>;
  if (stage === "not-started")
    return <p className="text-center mt-20">Contract not active yet.</p>;

}
