import { useState, useEffect } from 'react';
import { dashboardApi, DashboardStats } from '../api/dashboard.api';

export function useDashboard(userId: string, role: 'client' | 'model' | 'admin') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setLoading(true);
      try {
        const data = await dashboardApi.getDashboardStats(userId, role);
        setStats(data);
      } catch (e) {
        console.error('Failed to load dashboard metrics', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, role]);

  return { stats, loading };
}
