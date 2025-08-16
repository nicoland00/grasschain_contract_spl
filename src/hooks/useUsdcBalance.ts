// PRIVY:
"use client";
import { useEffect, useState } from "react";

export function useUsdcBalance(address?: string) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/wallet/usdc-balance?address=${address}`)
      .then(r => r.json())
      .then(j => { setBalance(j?.balance ?? 0); setError(null); })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [address]);

  return { balance, loading, error };
}
