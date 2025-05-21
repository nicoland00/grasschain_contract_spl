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
        <div className="flex flex-col lg:flex-row h-full">
    
          {/* ── LEFT: Contracts (60%) ── */}
          <div className="w-full lg:w-3/5 pr-4 overflow-auto">
            <h1 className="text-3xl font-bold text-center mb-4 md:text-4xl">
              Pastora&apos;s Available Contracts
            </h1>
            <GrasschainCreateContractForm />
            <hr className="border-gray-300 my-6" />
            <GrasschainContractsList />
          </div>
    
          {/* ── RIGHT: Calculator (40%) ── */}
          <div className="w-full lg:w-2/5 pl-4">
            <WeightGainProjection />
          </div>
    
        </div>
      );
}
