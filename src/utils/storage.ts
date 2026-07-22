export const storage = {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error parsing localStorage key: ${key}`, e);
      return null;
    }
  },

  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error stringifying localStorage key: ${key}`, e);
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
