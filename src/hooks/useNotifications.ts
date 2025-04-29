import { useState, useEffect } from 'react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  contract?: string;
}

export function useNotifications(params?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [all, setAll] = useState<Notification[]>([]);

  useEffect(() => {
    fetch(`/api/notifications${params}`)
      .then(res => res.json())
      .then(data => setAll(data));
  }, [params]);

  const markAllRead = () => setUnreadCount(0);

  return { unreadCount, all, markAllRead };
} 