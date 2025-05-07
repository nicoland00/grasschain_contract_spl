// src/hooks/useNotifications.ts
import useSWR from "swr";

export interface TNotification {
  _id:       string;
  title:     string;
  message:   string;
  contract:  string | null;
  stage:     string;
  createdAt: string;
}

// simple fetcher
const fetcher = (url: string): Promise<TNotification[]> =>
  fetch(url).then((r) => r.json());

export function useNotifications(contractQuery = "") {
  const url = `/api/notifications${contractQuery}`;
  const { data, error, mutate } = useSWR<TNotification[]>(url, fetcher);

  // POST + revalidate
  const createNotification = async (body: {
    title:       string;
    message:     string;
    contract:    string | null;
    stage?:      string;
    adminPubkey: string;
  }) => {
    await fetch("/api/notifications", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    await mutate();
  };

  return {
    all:              data ?? [],
    isLoading:        !data && !error,
    isError:          !!error,
    createNotification,
    markAllRead:      () => mutate(),
  };
}
