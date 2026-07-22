export type UserRole = 'client' | 'model' | 'admin';

export const permissions = {
  canAccessAdmin(role: UserRole): boolean {
    return role === 'admin';
  },

  canBecomeModel(role: UserRole): boolean {
    // Clients are strictly blocked from registering as models
    return role !== 'client';
  },

  canEditPortfolio(role: UserRole): boolean {
    return role === 'model' || role === 'admin';
  },

  canInitiateEscrow(role: UserRole): boolean {
    return role === 'client' || role === 'admin';
  }
};
