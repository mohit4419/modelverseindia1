export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'model' | 'admin';
  createdAt?: string;
}

export const usersApi = {
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`/api/v2/auth/profile/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve user profile');
    }
    return response.json();
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`/api/v2/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    return response.json();
  }
};
