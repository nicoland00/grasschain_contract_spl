"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import LoginIsland from "./LoginIsland";
import {
  GrasschainCreateContractForm,
  GrasschainContractsList,
} from "./grasschain_contract_spl-ui";

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
    <div className="w-full px-4">
      <h1 className="text-3xl font-bold text-center mb-4 md:text-4xl">
        Pastora&apos;s Available Contracts
      </h1>
      <GrasschainCreateContractForm />
      <hr className="border-gray-300" />
      <GrasschainContractsList />
    </div>
  );
}
