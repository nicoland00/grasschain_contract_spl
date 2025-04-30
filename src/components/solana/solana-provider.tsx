"use client";

import dynamic from "next/dynamic";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletError } from "@solana/wallet-adapter-base";
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";

// For a minimal wallet adapter, e.g. Phantom:
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

require("@solana/wallet-adapter-react-ui/styles.css");

// Dynamically import the multi-button:
export const WalletButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

// Re-export useWallet
export { useWallet };

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Instead of cluster logic, define a static endpoint:
  // e.g. devnet or mainnet-beta. Adjust as needed.
  const endpoint = clusterApiUrl("devnet");

  // If you want to support Phantom, Torus, etc. in a single array:
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    return new AnchorProvider(
      connection,
      wallet as AnchorWallet,
      { commitment: "confirmed" }
    );
  }, [connection, wallet]);
}
