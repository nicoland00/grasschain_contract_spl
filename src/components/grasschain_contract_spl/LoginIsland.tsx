// src/components/grasschain_contract_spl/LoginIsland.tsx
"use client";
import { signIn, useSession } from "next-auth/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function LoginIsland() {
  const { data: session, status } = useSession();
  const { setVisible } = useWalletModal();

  // if we're already authenticated, hide the overlay
  if (session || status === "loading") return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full space-y-6 text-center">
        <h2 className="text-3xl font-bold">Welcome to Pastora Trackign and Contracts</h2>
        <p className="text-m font !mt-1">In order to buy with crypto login with Solana, in order to buy with fiat login with Google</p>

        {/* Web3: open the wallet modal */}
        <div className="text-sm uppercase font-semibold mb-1">Web3:</div>
        <button
          className="btn btn-primary w-full mb-6 text-lg"
          onClick={() => setVisible(true)}
        >
          Log In with Solana
        </button>

        <div className="flex items-center justify-center space-x-2">
          <span className="h-px bg-gray-300 flex-1"></span>
          <span className="text-gray-500 uppercase text-sm">or</span>
          <span className="h-px bg-gray-300 flex-1"></span>
        
        </div>

        {/* Web2: redirect to Google */}
        <div className="text-sm uppercase font-semibold mb-1">Web2:</div>
        <button
          className="btn btn-outline w-full text-lg"
          onClick={() => signIn("google")}
        >
          Log In with Google
        </button>
      </div>
    </div>
  );
}
