// src/app/notifications/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import LoginIsland from "@/components/grasschain_contract_spl/LoginIsland";

export const metadata = { title: "Pastora Notifications" };

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { publicKey, connected } = useWallet();

  // if neither Google nor Solana, show login overlay
  if (status !== "loading" && !session && !(connected && publicKey)) {
    return <LoginIsland />;
  }

  return <>{children}</>;
}
