/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking } from '../types';

export const bookingsApi = {
  async getBookings(params?: { clientId?: string; modelId?: string }): Promise<Booking[]> {
    let query = '';
    if (params?.clientId) {
      query = `?clientId=${params.clientId}`;
    } else if (params?.modelId) {
      query = `?modelId=${params.modelId}`;
    }
    const response = await fetch(`/api/v2/bookings${query}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch bookings');
    }
    return result.data;
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await fetch(`/api/v2/bookings/${id}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch booking');
    }
    return result.data;
  },

  async createBooking(booking: Booking): Promise<Booking> {
    const response = await fetch('/api/v2/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create booking');
    }
    return result.data;
  },

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const response = await fetch(`/api/v2/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update booking status');
    }
    return result.data;
  },

  async shareWithClient(id: string, isShared: boolean): Promise<Booking> {
    const response = await fetch(`/api/v2/bookings/${id}/share`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isShared }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to share booking details');
    }
    return result.data;
  }
};
