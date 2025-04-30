// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactQueryProvider } from "./react-query-provider";
import { SolanaProvider } from "@/components/solana/solana-provider";

// add these:
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <SolanaProvider>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </SolanaProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
