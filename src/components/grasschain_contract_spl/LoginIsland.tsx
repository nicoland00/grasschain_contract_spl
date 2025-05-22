// src/components/grasschain_contract_spl/LoginIsland.tsx
"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function LoginIsland() {
  const { data: session, status } = useSession();
  const { setVisible } = useWalletModal();

  if (session || status === "loading") return null;

  return (
    <div
      className="
        fixed inset-0
        bg-gradient-to-b from-green-300 via-green-700 to-black
        flex items-center justify-center z-50
      "
    >
      <div
        className="
          bg-white rounded-2xl p-8
          w-full max-w-md sm:max-w-lg
          mx-4
          space-y-6 text-center
          shadow-2xl
        "
      >
        {/* logo.png must be placed in /public/logo.png */}
        <div className="mx-auto w-24 h-24 relative">
          <Image
            src="/logo.png"
            alt="Pastora logo"
            fill
            className="object-contain"
          />
        </div>

        <h2 className="text-3xl font-bold text-black">
          Welcome to Pastora
        </h2>
        <p className="text-base text-gray-600">
          In order to buy cattle with crypto, log in with Solana.<br/>
          To buy with fiat, log in with Google.
        </p>

        {/* Web3 */}
        <div className="text-sm uppercase font-semibold text-gray-500">
          Web3:
        </div>
        <button
          onClick={() => setVisible(true)}
          className="
            w-full
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white font-semibold
            py-4 px-6
            rounded-xl
            shadow-lg
            transform transition-all duration-200
            hover:scale-105 hover:shadow-xl
            disabled:opacity-70 disabled:cursor-not-allowed
          "
        >
          Log In with Solana
        </button>

        <div className="flex items-center justify-center space-x-3">
          <span className="h-px bg-gray-300 flex-1"></span>
          <span className="text-gray-500 uppercase text-sm">or</span>
          <span className="h-px bg-gray-300 flex-1"></span>
        </div>

        {/* Web2 */}
        <div className="text-sm uppercase font-semibold text-gray-500">
          Web2:
        </div>
        <button
          onClick={() => signIn("google")}
          className="
            btn btn-outline
            w-full
            py-4
            text-lg
            rounded-xl
          "
        >
          Log In with Google
        </button>
      </div>
    </div>
  );
}
