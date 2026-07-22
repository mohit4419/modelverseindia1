export const socketService = {
  createConnection(url: string): WebSocket | null {
    try {
      return new WebSocket(url);
    } catch (e) {
      console.error('Socket creation failed', e);
      return null;
    }
  }
};
