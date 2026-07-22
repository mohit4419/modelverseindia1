import { notificationsApi } from '../api/notifications.api';

export const notificationService = {
  async getNotifications(userId: string) {
    return notificationsApi.getNotifications(userId);
  },

  async markAsRead(id: string) {
    return notificationsApi.markAsRead(id);
  }
};
