// src/components/grasschain_contract_spl/LoginIsland.tsx
"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";


export default function LoginIsland() {
  const { data: session, status } = useSession();
  const { setVisible } = useWalletModal();

  const handleSolanaLogin = () => {
    const isMobile =
      typeof window !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const redirect = encodeURIComponent("https://app.pastora.io");
        window.location.href =
          `https://phantom.app/ul/v1/connect?redirect_link=${redirect}`;
    } else {
      setVisible(true);
    }
  };

  // If the user is already logged in (or auth status is still loading), don't show this overlay
  if (session || status === "loading") return null;

  return (
    <div
      className="
        fixed inset-0
        bg-black      /* solid black background */
        flex items-center justify-center
        z-50
        px-4 pb-8
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
        {/* Logo (ensure /public/logo.png exists) */}
        <div className="mx-auto w-24 h-24 relative">
          <Image
            src="/logo.png"
            alt="Pastora logo"
            fill
            className="object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-black">
          Welcome to Pastora
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-600 leading-relaxed">
          In order to buy cattle with crypto, log in with Solana.<br />
          To buy with fiat, log in with Google.
        </p>

        {/* Web3 Section */}
        <div className="text-sm uppercase font-semibold text-gray-500">
          Web3:
        </div>
        <button
          onClick={handleSolanaLogin}
          className="
            w-full
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white font-semibold text-lg
            py-4
            rounded-xl
            shadow-lg
            transform transition-all duration-200
            hover:scale-105 hover:shadow-xl
            disabled:opacity-70 disabled:cursor-not-allowed
          "
        >
          Log In with Solana
        </button>

        {/* “or” Divider */}
        <div className="flex items-center justify-center space-x-3">
          <span className="h-px bg-gray-300 flex-1"></span>
          <span className="text-gray-500 uppercase text-sm">or</span>
          <span className="h-px bg-gray-300 flex-1"></span>
        </div>

        {/* Web2 Section */}
        <div className="text-sm uppercase font-semibold text-gray-500">
          Web2:
        </div>
        <button
          onClick={() => signIn("google")}
          className="
            w-full
            border-2 border-gray-800
            text-gray-800 font-semibold text-lg
            py-4
            rounded-xl
            hover:bg-gray-100
            transition-colors duration-200
          "
        >
          Log In with Google
        </button>
      </div>
    </div>
  );
}
