// PRIVY:
"use client";
import { PRIVY_ENABLED } from "@/lib/flags";
import { usePrivy } from "@privy-io/react-auth";
// LEGACY:
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";

export function useUnifiedIdentity() {
  const privy = PRIVY_ENABLED ? usePrivy() : (null as any);
  const { data: session } = useSession();
  const { publicKey } = useWallet();

  const email =
    (PRIVY_ENABLED ? privy?.user?.email?.address : undefined) ||
    session?.user?.email ||
    undefined;

  const address =
    (PRIVY_ENABLED
      ? (privy?.user as any)?.wallet?.address ||
        privy?.user?.linkedAccounts?.find((a: any) => a.type === "wallet")?.address
      : undefined) ||
    (publicKey ? publicKey.toBase58() : undefined);

  const authenticated = PRIVY_ENABLED ? !!privy?.authenticated : !!(session || publicKey);
  const login = async () => {
    if (PRIVY_ENABLED && privy?.login) return privy.login();
    // Legacy fallback: dispara tu overlay o flujo actual
    window.dispatchEvent(new CustomEvent("OPEN_LOGIN_OVERLAY"));
  };

  return { email, address, authenticated, login, userId: PRIVY_ENABLED ? privy?.user?.id : undefined };
}
