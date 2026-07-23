/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Booking, BookingStatus, Message } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureUserExistsInDb, ensureModelExistsInDb } from './helpers';
import { SEED_BOOKINGS, SEED_USERS, SEED_MODELS } from './seedData';
import { messageService } from './messageService';

export const bookingService = {
  subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
    if (isSupabaseAvailable && supabase) {
      const channel = supabase
        .channel('schema-db-changes-bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          async () => {
            const fresh = await this.getBookings();
            callback(fresh);
          }
        )
        .subscribe();

      this.getBookings().then(callback);

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      this.getBookings().then(callback);
      return () => {};
    }
  },

  async getBookings(): Promise<Booking[]> {
    let dbBookings: Booking[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && data) {
          dbBookings = data as Booking[];
        }
      } catch (e) {
        console.error('Supabase bookings fetch failed', e);
      }
    }
    const local = localStorage.getItem('mvi_bookings');
    const localBookings: Booking[] = local ? JSON.parse(local) : SEED_BOOKINGS;

    const mergedMap = new Map<string, Booking>();
    SEED_BOOKINGS.forEach(b => mergedMap.set(b.id, b));
    localBookings.forEach(b => mergedMap.set(b.id, b));
    dbBookings.forEach(b => mergedMap.set(b.id, b));

    return Array.from(mergedMap.values());
  },

  async addBooking(booking: Booking): Promise<void> {
    try {
      const bookings = await this.getBookings();
      bookings.push(booking);
      localStorage.setItem('mvi_bookings', JSON.stringify(bookings));
    } catch (localErr) {
      console.error('Local storage addBooking failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await ensureUserExistsInDb(booking.clientId, booking.clientName, undefined, SEED_USERS);
        await ensureModelExistsInDb(booking.modelId, SEED_MODELS);
        const { error } = await supabase
          .from('bookings')
          .insert(removeUndefined(booking));
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase bookings save failed (falling back to local):', e);
      }
    }

    const introMsg: Message = {
      id: `msg_auto_${Date.now()}_1`,
      senderId: booking.clientId,
      receiverId: booking.modelId,
      content: `📦 NEW BOOKING REQUEST:\n\nBrand: ${booking.projectDetails.brandName}\nShoot: ${booking.projectDetails.shootType}\nDate: ${booking.projectDetails.date}\nDuration: ${booking.projectDetails.duration}\nBudget: ${booking.projectDetails.budgetRange}\nNotes: ${booking.projectDetails.notes || 'None'}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      bookingId: booking.id
    };
    await messageService.addMessage(introMsg);
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx >= 0) {
        bookings[idx].status = status;
        localStorage.setItem('mvi_bookings', JSON.stringify(bookings));

        const clientMsg: Message = {
          id: `msg_sys_${Date.now()}`,
          senderId: 'system',
          receiverId: bookings[idx].clientId,
          content: `🔔 Booking status of ${bookings[idx].projectDetails.brandName} (Model: ${bookings[idx].modelName}) is now: "${status.toUpperCase()}".`,
          timestamp: new Date().toISOString(),
          isRead: false,
          bookingId: bookingId
        };
        await messageService.addMessage(clientMsg);
      }
    } catch (localErr) {
      console.error('Local storage updateBookingStatus failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status })
          .eq('id', bookingId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase bookings update status failed (falling back to local):', e);
      }
    }
  },

  async updateBookingPdfSummary(bookingId: string, pdfSummaryUrl: string, isSharedWithClient: boolean): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx >= 0) {
        bookings[idx].pdfSummaryUrl = pdfSummaryUrl;
        bookings[idx].pdfGeneratedAt = new Date().toISOString();
        bookings[idx].isSharedWithClient = isSharedWithClient;
        localStorage.setItem('mvi_bookings', JSON.stringify(bookings));
      }
    } catch (localErr) {
      console.error('Local storage updateBookingPdfSummary failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ 
            pdfSummaryUrl, 
            pdfGeneratedAt: new Date().toISOString(), 
            isSharedWithClient 
          })
          .eq('id', bookingId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase bookings update PDF summary failed (falling back to local):', e);
      }
    }
  }
};
