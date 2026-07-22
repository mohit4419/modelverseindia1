export const storageService = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('LocalStorage read failed', e);
      return null;
    }
  },

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('LocalStorage delete failed', e);
    }
  }
};
