// PRIVY:
"use client";
import { useState } from "react";
import { PRIVY_ENABLED } from "@/lib/flags";
import { useUnifiedIdentity } from "@/hooks/useUnifiedIdentity";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { usePrivy } from "@privy-io/react-auth";

export default function WalletButton() {
  if (!PRIVY_ENABLED) return null; // No mostrar si flag off
  const [open, setOpen] = useState(false);
  const { address, authenticated, login } = useUnifiedIdentity();
  const { balance, loading } = useUsdcBalance(address);
  const { fundWallet } = (usePrivy() as any) || {};

  return (
    <>
      <button className="btn btn-outline" onClick={async ()=>{ if(!authenticated) await login(); setOpen(true); }}>
        Wallet {address ? `· ${loading ? "..." : balance.toFixed(2)} USDC` : ""}
      </button>
      {open && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center" onClick={()=>setOpen(false)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Your wallet</h3>
            <p className="text-sm break-all">Address: {address ?? "—"}</p>
            <div className="mt-3">
              <span className="text-2xl font-bold">{loading ? "…" : `${balance.toFixed(2)} USDC`}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary flex-1" onClick={async()=>{ if(address && fundWallet) await fundWallet(address); }}>
                Add funds
              </button>
              <button className="btn flex-1" onClick={()=>setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
