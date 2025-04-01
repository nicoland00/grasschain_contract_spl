"use client"; // Asegúrate de tener esto si usas Next.js App Router

import React, { useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

interface DebugTemporalProps {
  contractAddress: string; // en string base58
}

export function DebugTemporal({ contractAddress }: DebugTemporalProps) {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (!publicKey) {
      console.log("Conecta tu wallet");
      return;
    }
    if (!contractAddress) {
      console.log("No se pasó un contractAddress válido");
      return;
    }

    const contractPk = new PublicKey(contractAddress);
    const investorPk = publicKey; // el usuario conectado
    const programId = new PublicKey("DEJZTPLawYKXToniBkuJahA1V2Y2DNNYpXx485hkAeLK");

    const [pda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("investor-record"),
        contractPk.toBuffer(),
        investorPk.toBuffer(),
      ],
      programId
    );

    console.log("InvestorRecord PDA:", pda.toBase58());
    console.log("Bump:", bump);
  }, [publicKey, contractAddress]);

  return <div>Revisa la consola del navegador para ver la PDA del InvestorRecord.</div>;
}
