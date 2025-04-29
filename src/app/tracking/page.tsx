// src/app/tracking/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import OverlayLayout from "@/components/tracking/overlayLayout";
import Select from "@/components/ui/Select";
import MapComponent from "@/components/tracking/MapComponent";

type Option = { label: string; value: string };

export default function TrackingPage() {
  const { data: session, status: authStatus } = useSession();
  const { publicKey, connected } = useWallet();
  const [stage, setStage] = useState<"loading"|"no-contracts"|"not-started"|"select">("loading");
  const [opts, setOpts] = useState<Option[]>([]);
  const [sel, setSel] = useState<string>();

  useEffect(() => {
    async function load() {
      if (authStatus === "loading") return;

      // determina parámetro
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
      const list: { contractId: string; status: string }[] = await res.json();

      if (list.length === 0) return setStage("no-contracts");

      const active = list.filter(c => c.status === "active");
      if (active.length === 0) return setStage("not-started");

      const options = active.map(c => ({ label: c.contractId, value: c.contractId }));
      setOpts(options);
      setSel(options[0].value);
      setStage("select");
    }
    load();
  }, [session, authStatus, connected, publicKey]);

  if (stage === "loading")      return <p className="text-center mt-20">Verifying…</p>;
  if (stage === "no-contracts") return <p className="text-center mt-20">No contracts found.</p>;
  if (stage === "not-started")  return <p className="text-center mt-20">Contract not active yet.</p>;

  return (
    <OverlayLayout>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">Select a contract to track</h1>
        <Select options={opts} value={sel} onChange={v => setSel(v)} />
      </div>
      {sel && <MapComponent sidebarOpen={false} />}
    </OverlayLayout>
  );
}
