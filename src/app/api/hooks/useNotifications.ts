// src/hooks/useNotifications.ts
import useSWR from "swr";
import { useWallet } from "@solana/wallet-adapter-react";

type StageKey = 
  | "bought"
  | "verification"
  | "active"
  | "settling"
  | "settled"
  | "defaulted";

export interface Notification {
  _id:      string;
  title:    string;
  message:  string;
  contract: string | null;
  stage:    StageKey;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Notification[]>);

export function useNotifications() {
  const { publicKey } = useWallet();

  // build the URL: if we have a wallet, pass it
  const url = publicKey
    ? `/api/notifications?wallet=${publicKey.toBase58()}`
    : `/api/notifications`;

  const { data, error, mutate } = useSWR<Notification[]>(url, fetcher);

  return {
    notifications: data ?? [],
    isLoading:     !error && !data,
    isError:       !!error,
    mutate,
  };
}
