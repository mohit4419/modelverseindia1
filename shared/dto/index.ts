/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, BookingStatus } from '../types';

export interface LoginRequestDto {
  email: string;
  password_hash?: string;
  password?: string;
}

export interface RegisterRequestDto {
  email: string;
  password?: string;
  password_hash?: string;
  name: string;
  phone_number?: string;
  role: UserRole;
}

export interface CreateBookingRequestDto {
  clientId: string;
  modelId: string;
  amount: number;
  bookingDate: string;
  location: string;
  notes?: string;
}

export interface UpdateBookingStatusRequestDto {
  status: BookingStatus;
}
