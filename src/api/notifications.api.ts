/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  async getNotifications(userId: string): Promise<SystemNotification[]> {
    const response = await fetch(`/api/v2/notifications/${userId}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch notifications');
    }
    return result.data;
  },

  async markAsRead(id: string): Promise<boolean> {
    const response = await fetch(`/api/v2/notifications/${id}/read`, {
      method: 'PUT',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark notification as read');
    }
    return result.success;
  }
};
