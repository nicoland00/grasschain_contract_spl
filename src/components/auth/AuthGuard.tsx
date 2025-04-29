// src/components/auth/AuthGuard.tsx
"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import LoginIsland from "@/components/grasschain_contract_spl/LoginIsland";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { connected, publicKey } = useWallet();

  // while NextAuth is loading we flash nothing
  if (status === "loading") return null;

  // if neither Web2 nor Web3 is signed in, show the one LoginIsland
  if (!session && !(connected && publicKey)) {
    return <LoginIsland />;
  }

  // otherwise render the app
  return <>{children}</>;
}
