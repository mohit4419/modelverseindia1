/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'client' | 'model' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type BookingStatus = 'pending' | 'assigned' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type PaymentStatus = 'success' | 'pending' | 'failed';
export type PayoutStatus = 'escrowed' | 'pending_approval' | 'released' | 'cancelled';
