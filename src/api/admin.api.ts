/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const adminApi = {
  async getStats(token: string) {
    const response = await fetch('/api/v2/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch admin stats');
    }
    return result.stats;
  },

  async approveModel(id: string, token: string) {
    const response = await fetch(`/api/v2/admin/approve-model/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to approve model');
    }
    return result.data;
  }
};
