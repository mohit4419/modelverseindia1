import { authApi } from '../api/auth.api';

export const authService = {
  async login(credentials: any) {
    return authApi.login(credentials);
  },

  async register(data: any) {
    return authApi.register(data);
  },

  async getProfile(userId: string) {
    return authApi.getProfile(userId);
  }
};
