// src/components/grasschain_contract_spl/LoginIsland.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { signIn, useSession } from "next-auth/react";

export default function LoginIsland() {
  const { data: session, status } = useSession();
  if (session || status === "loading") return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full space-y-4 text-center">
        <h2 className="text-2xl font-bold">Welcome to Pastora</h2>

        {/* Solana wallet */}
        <WalletMultiButton className="w-full mb-4" />

        {/* Google OAuth only */}
        <button
          className="btn btn-outline w-full"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
