import { useState, useEffect } from 'react';
import { notificationsApi } from '../api/notifications.api';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setLoading(true);
      try {
        const list = await notificationsApi.getNotifications(userId);
        setNotifications(list);
      } catch (e) {
        console.error('Failed to load notifications', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return { notifications, loading, markAsRead };
}
