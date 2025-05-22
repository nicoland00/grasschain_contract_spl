"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import LoginIsland from "./LoginIsland";
import {
  GrasschainCreateContractForm,
  GrasschainContractsList,
} from "./grasschain_contract_spl-ui";
import WeightGainProjection from "@/components/calculator/WeightGainProjection";

export default function GrasschainContractSplFeature() {
  const { publicKey } = useWallet();
  const { status } = useSession();

  // if neither a wallet is connected nor a NextAuth session exists,
  // show our “must log in” island
  if (!publicKey && status !== "authenticated") {
    return <LoginIsland />;
  }

  // otherwise, render the normal admin/investor UI
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 py-8 bg-appDarkGray min-h-screen">
    
          {/* ── LEFT: Contracts (60%) ── */}
          <div className="overflow-auto">
            <h1 className="text-3xl font-bold text-center mb-4 md:text-4xl">
              Pastora&apos;s Available Contracts
            </h1>
            <GrasschainCreateContractForm />
            <GrasschainContractsList />
          </div>
    
          {/* ── RIGHT: Calculator (40%) ── */}
          <div>
            <WeightGainProjection />
          </div>
    
        </div>
      );
}
