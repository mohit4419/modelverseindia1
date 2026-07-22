/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';

export const authApi = {
  async register(payload: { email: string; password: string; name?: string; phone_number?: string; role?: string }) {
    const response = await fetch('/api/v2/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }
    return result;
  },

  async login(payload: { email: string; password: string }) {
    const response = await fetch('/api/v2/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Login failed');
    }
    return result;
  },

  async getProfile(userId: string): Promise<User> {
    const response = await fetch(`/api/v2/auth/profile/${userId}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch profile');
    }
    return result.data;
  },

  async getSupabaseStatus() {
    const response = await fetch('/api/v2/auth/status');
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch Supabase status');
    }
    return result;
  }
};
