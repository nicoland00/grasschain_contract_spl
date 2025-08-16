// PRIVY:
"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_ENABLED } from "@/lib/flags";

export function MaybePrivy({ children }: { children: React.ReactNode }) {
  if (!PRIVY_ENABLED) return <>{children}</>;
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
      {children}
    </PrivyProvider>
  );
}
