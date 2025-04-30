// src/hooks/useNotifications.ts
"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  contract?: string;
  createdAt: string;
}

export function useNotifications(params: string /* e.g. "?wallet=..." or "" */) {
  const [all, setAll] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const SEEN_COOKIE = "seenNotifications";

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notifications${params}`);
      const list: Notification[] = await res.json();
      setAll(list);

      // read seen IDs from cookie
      const seen = Cookies.get(SEEN_COOKIE)?.split(",") || [];
      // count how many IDs are not seen
      const unread = list.filter((n) => !seen.includes(n._id)).length;
      setUnreadCount(unread);
    }
    load();
  }, [params]);

  // mark all as read
  function markAllRead() {
    const ids = all.map((n) => n._id).join(",");
    Cookies.set(SEEN_COOKIE, ids, { expires: 365 });
    setUnreadCount(0);
  }

  return { all, unreadCount, markAllRead };
}
