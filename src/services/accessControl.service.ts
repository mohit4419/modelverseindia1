/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbService } from './db';

export type AccessTier = 'free' | 'individual' | 'enterprise';

export type RestrictedFeature = 'book' | 'chat' | 'compCard' | 'specs';

export interface UserAccessState {
  userId: string;
  tier: AccessTier;
  unlockedModelIds: string[];
  enterpriseExpiry?: string;
  lastPaymentId?: string;
}

const STORAGE_KEY_PREFIX = 'mvi_access_control_';

export const accessControlService = {
  /**
   * Get current user access state from localStorage or defaults
   */
  getAccessState(userId: string = 'guest_client'): UserAccessState {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse access state from storage:', e);
    }

    // Default: Check global unlocked profiles or enterprise flag
    const defaultUnlocked = dbService.getUnlockedProfiles();
    const isEnterprise = localStorage.getItem('mvi_enterprise_active') === 'true';

    return {
      userId,
      tier: isEnterprise ? 'enterprise' : 'free',
      unlockedModelIds: defaultUnlocked || [],
    };
  },

  /**
   * Save user access state to local storage and sync with dbService
   */
  saveAccessState(state: UserAccessState): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${state.userId}`, JSON.stringify(state));
      if (state.tier === 'enterprise') {
        localStorage.setItem('mvi_enterprise_active', 'true');
      }
      state.unlockedModelIds.forEach((mId) => {
        dbService.unlockProfile(mId);
      });
    } catch (e) {
      console.error('Failed to save access state:', e);
    }
  },

  /**
   * Check if a model is unlocked for a given user (either individually or via Enterprise tier)
   */
  hasModelAccess(userId: string = 'guest_client', modelId?: string | null): boolean {
    if (!modelId) return false;
    const state = this.getAccessState(userId);
    if (state.tier === 'enterprise') {
      return true;
    }
    const globalUnlocked = dbService.getUnlockedProfiles();
    return state.unlockedModelIds.includes(modelId) || globalUnlocked.includes(modelId);
  },

  /**
   * Check if user has Enterprise tier access
   */
  hasEnterpriseAccess(userId: string = 'guest_client'): boolean {
    const state = this.getAccessState(userId);
    return state.tier === 'enterprise' || localStorage.getItem('mvi_enterprise_active') === 'true';
  },

  /**
   * Check if a specific restricted feature ('book' | 'chat' | 'compCard' | 'specs') is unlocked for user + model
   */
  isFeatureAllowed(
    userId: string = 'guest_client',
    modelId?: string | null,
    _feature?: RestrictedFeature
  ): boolean {
    return this.hasModelAccess(userId, modelId);
  },

  /**
   * Record a verified payment unlock (Individual or Enterprise)
   */
  recordPaymentUnlock(params: {
    userId?: string;
    modelId?: string;
    planType?: 'premium' | 'individual' | 'enterprise';
    amount?: number;
    paymentId?: string;
    orderId?: string;
    gateway?: string;
  }): UserAccessState {
    const userId = params.userId || 'guest_client';
    const state = this.getAccessState(userId);

    const isEnterprisePlan = params.planType === 'enterprise' || params.amount === 4999 || params.amount === 499;

    if (isEnterprisePlan) {
      state.tier = 'enterprise';
      localStorage.setItem('mvi_enterprise_active', 'true');
      if (params.modelId && !state.unlockedModelIds.includes(params.modelId)) {
        state.unlockedModelIds.push(params.modelId);
      }
    } else {
      if (state.tier === 'free') {
        state.tier = 'individual';
      }
      if (params.modelId && !state.unlockedModelIds.includes(params.modelId)) {
        state.unlockedModelIds.push(params.modelId);
      }
    }

    if (params.paymentId) {
      state.lastPaymentId = params.paymentId;
    }

    this.saveAccessState(state);

    if (params.modelId) {
      dbService.unlockProfile(params.modelId);
    }

    return state;
  },

  /**
   * Get list of all unlocked model IDs for user
   */
  getUnlockedModels(userId: string = 'guest_client'): string[] {
    const state = this.getAccessState(userId);
    const globalUnlocked = dbService.getUnlockedProfiles();
    const merged = new Set([...state.unlockedModelIds, ...globalUnlocked]);
    return Array.from(merged);
  },

  /**
   * Get current user payment tier ('free' | 'individual' | 'enterprise')
   */
  getPaymentTier(userId: string = 'guest_client'): AccessTier {
    return this.getAccessState(userId).tier;
  },

  /**
   * Reset access for testing
   */
  clearAccess(userId: string = 'guest_client'): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    localStorage.removeItem('mvi_enterprise_active');
  }
};
