let cachedNotifications: any[] = [];

export const notificationStore = {
  getNotifications(): any[] {
    return cachedNotifications;
  },

  setNotifications(notifications: any[]): void {
    cachedNotifications = notifications;
  },

  addNotification(notification: any): void {
    cachedNotifications.unshift(notification);
  }
};
