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

  if (!publicKey && status !== "authenticated") {
    return <LoginIsland />;
  }

  return (
    <div className="bg-appDarkGray min-h-screen">
      {/* Centered header */}
      <h1 className="text-3xl font-bold text-center my-4 md:text-4xl">
        Pastora&apos;s Available Contracts
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 pb-8">
        {/* Left: scrollable contracts */}
        <div className="overflow-auto space-y-6">
          <GrasschainCreateContractForm />
          <GrasschainContractsList />
        </div>

        {/* Right: static calculator, hidden on small screens */}
        <div className="sticky top-0 hidden md:block">
          <WeightGainProjection />
        </div>
      </div>
    </div>
  );
}
