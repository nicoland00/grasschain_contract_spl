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
    <div className="w-full px-4 py-6">
      {publicKey ? (
        <>
          <h1 className="text-4xl font-bold text-center mb-6">
            Pastora's Web3 Contracts
          </h1>
          <GrasschainCreateContractForm />
          <hr className="border-gray-300 my-6" />
          <h2 className="text-3xl font-bold text-center mb-6">
            Available Contracts
          </h2>
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
