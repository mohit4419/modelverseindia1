export interface DashboardStats {
  totalBookings: number;
  totalEarnings: number;
  activeChats: number;
  unverifiedContracts: number;
}

export const dashboardApi = {
  async getDashboardStats(userId: string, role: 'client' | 'model' | 'admin'): Promise<DashboardStats> {
    if (role === 'admin') {
      const response = await fetch('/api/v2/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to retrieve admin stats');
      }
      return response.json();
    }
    
    // Fallback/mock metrics for client/model role dashboards
    return {
      totalBookings: 3,
      totalEarnings: 45000,
      activeChats: 2,
      unverifiedContracts: 0,
    };
  }
};
