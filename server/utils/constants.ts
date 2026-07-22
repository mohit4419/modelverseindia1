/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ROLES = {
  CLIENT: 'client',
  MODEL: 'model',
  ADMIN: 'admin',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_STATUS = {
  SUCCESS: 'success',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
export const PREMIUM_UNLOCK_INR = 299;
