"use client";

import { useEffect } from "react";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";

export default function CryptoInvestPage() {
  const { authenticated, login, address } = useAuthIdentity();

  useEffect(() => {
    if (!authenticated) login();
  }, [authenticated, login]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Invest with Crypto</h1>
      {address ? (
        <p>Wallet address: {address}</p>
      ) : (
        <p>Loading wallet...</p>
      )}
    </div>
  );
}
