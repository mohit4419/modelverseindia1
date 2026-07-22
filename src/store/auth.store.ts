export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  role: 'client' | 'model' | 'admin' | null;
  email: string | null;
}

let currentAuthState: AuthState = {
  isAuthenticated: false,
  userId: null,
  role: null,
  email: null,
};

export const authStore = {
  getState(): AuthState {
    return { ...currentAuthState };
  },

  setState(newState: Partial<AuthState>): void {
    currentAuthState = { ...currentAuthState, ...newState };
  },

  clear(): void {
    currentAuthState = {
      isAuthenticated: false,
      userId: null,
      role: null,
      email: null,
    };
  }
};
