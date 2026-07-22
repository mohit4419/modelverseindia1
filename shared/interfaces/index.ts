/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, UserStatus, BookingStatus, PaymentStatus } from '../types';

export interface IProfile {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  avatarUrl?: string;
  createdAt?: string;
}

export interface IModel {
  id: string;
  userId: string;
  name: string;
  gender?: string;
  age?: number;
  height?: string;
  city: string;
  state: string;
  languages?: string[];
  experience?: string;
  category: string;
  portfolio?: string[];
  startingPrice?: number;
  rating?: number;
}

export interface IBooking {
  id: string;
  clientId: string;
  clientName: string;
  modelId: string;
  modelName: string;
  status: BookingStatus;
  priceAmount: number;
  createdAt: string;
}
