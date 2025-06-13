// src/hooks/useNotifications.ts
import useSWR from "swr";

export interface TNotification {
  _id:       string;
  title:     string;
  message:   string;
  contract:  string | null;
  stage:     string;
  mediaUrls: string[];
  createdAt: string;
}

// GET
const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<TNotification[]>);

export function useNotifications(query = "") {
  const url = `/api/notifications${query}`;              // e.g. "?contract=xxxx"
  const { data, error, mutate } = useSWR<TNotification[]>(url, fetcher);

  // POST + revalidate
  const createNotification = async (body: {
    title: string;
    message: string;
    contract?: string | null;
    stage?: string;
    mediaUrls?: string[];
    adminPubkey: string;
  }) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await mutate();
  };

  const updateNotification = async (
    id: string,
    body: {
      title: string;
      message: string;
      contract: string | null;
      mediaUrls: string[];
      adminPubkey: string;
    }
  ) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await mutate();
  };

  const deleteNotification = async (id: string, adminPubkey: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPubkey }),
    });
    await mutate();
  };


  return {
    all:               data ?? [],
    isLoading:         !data && !error,
    isError:           !!error,
    createNotification,
    updateNotification,
    deleteNotification,
    markAllRead:       () => mutate(), // clear badge = revalidate
  };
}
