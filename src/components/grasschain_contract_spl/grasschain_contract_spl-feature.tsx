"use client";

import React from "react";
import {
  GrasschainCreateContractForm,
  GrasschainContractsList,
} from "./grasschain_contract_spl-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function GrasschainContractSplFeature() {
  const { publicKey } = useWallet();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {publicKey ? (
        <>
          <h1 className="text-3xl font-bold text-center">
            Grasschain Contract SPL Example
          </h1>
          <GrasschainCreateContractForm />
          <hr />
          <h2 className="text-xl font-semibold">Available Contracts</h2>
          <GrasschainContractsList />
        </>
      ) : (
        <div className="p-4 text-center text-gray-600">
          Please connect your wallet.
        </div>
      )}
    </div>
  );
}
