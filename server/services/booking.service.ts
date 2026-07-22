/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingRepository } from '../repositories/booking.repository';
import { Booking } from '../types';

export class BookingService {
  private bookingRepository = new BookingRepository();

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepository.findAll();
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return this.bookingRepository.findById(id);
  }

  async getBookingsByClient(clientId: string): Promise<Booking[]> {
    const all = await this.bookingRepository.findAll();
    return all.filter((b) => b.clientId === clientId);
  }

  async getBookingsByModel(modelId: string): Promise<Booking[]> {
    const all = await this.bookingRepository.findAll();
    return all.filter((b) => b.modelId === modelId);
  }

  async createBooking(bookingData: Booking): Promise<Booking> {
    return this.bookingRepository.save(bookingData);
  }

  async updateBookingStatus(
    id: string,
    status: Booking['status']
  ): Promise<Booking | null> {
    const existing = await this.bookingRepository.findById(id);
    if (!existing) return null;

    const updated: Booking = {
      ...existing,
      status,
    };

    return this.bookingRepository.save(updated);
  }

  async shareWithClient(id: string, isShared: boolean = true): Promise<Booking | null> {
    const existing = await this.bookingRepository.findById(id);
    if (!existing) return null;

    const updated: Booking = {
      ...existing,
      isSharedWithClient: isShared,
    };

    return this.bookingRepository.save(updated);
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    const existing = await this.bookingRepository.findById(id);
    if (!existing) return null;

    const updated: Booking = {
      ...existing,
      ...updates,
      id,
    };

    return this.bookingRepository.save(updated);
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookingRepository.delete(id);
  }
}
