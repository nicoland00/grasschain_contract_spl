// src/hooks/useNotifications.ts
import useSWR from "swr";

type StageKey = 
  | "bought"
  | "verification"
  | "active"
  | "settling"
  | "settled"
  | "defaulted";

export interface TNotification {
  _id:      string;
  title:    string;
  message:  string;
  contract: string | null;
  stage:    StageKey;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<TNotification[]>);

export function useNotifications(contractId?: string) {
  // if you pass a contractId, add it; otherwise fetch everything your API already knows
  const url = contractId
    ? `/api/notifications?contract=${contractId}`
    : "/api/notifications";

  const { data, error, mutate } = useSWR<TNotification[]>(url, fetcher);

  return {
    notifications: data ?? [],
    isLoading:     !error && !data,
    isError:       !!error,
    mutate,
  };
}
