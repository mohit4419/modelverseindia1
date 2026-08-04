/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Booking, BookingStatus, Message } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureUserExistsInDb, ensureModelExistsInDb } from './helpers';
import { SEED_BOOKINGS, SEED_USERS, SEED_MODELS } from './seedData';
import { messageService } from './messageService';

// Map Supabase snake_case row to app camelCase Booking
function fromSupabaseBookingRow(row: any): Booking {
  const modelIdVal = row.model_id || row.modelId || row.model_id_val || '';
  const clientIdVal = row.client_id || row.clientId || row.client_id_val || '';
  return {
    id: row.id,
    clientId: clientIdVal,
    clientName: row.client_name || row.clientName || '',
    modelId: modelIdVal,
    modelName: row.model_name || row.modelName || '',
    modelImage: row.model_image || row.modelImage || '',
    projectDetails: {
      ...(row.project_details || row.projectDetails || {}),
      modelId: modelIdVal,
      clientId: clientIdVal
    },
    status: row.status || 'pending',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    priceAmount: Number(row.price_amount || row.priceAmount || row.amount || 0),
    pdfSummaryUrl: row.pdf_summary_url || row.pdfSummaryUrl,
    pdfGeneratedAt: row.pdf_generated_at || row.pdfGeneratedAt,
    isSharedWithClient: row.is_shared_with_client || row.isSharedWithClient || false,
  };
}

// Map app camelCase Booking to Supabase snake_case row
function toSupabaseBookingRow(booking: Booking): Record<string, any> {
  return removeUndefined({
    id: booking.id,
    client_id: booking.clientId,
    client_name: booking.clientName,
    model_id: booking.modelId,
    model_name: booking.modelName,
    model_image: booking.modelImage,
    project_details: {
      ...booking.projectDetails,
      modelId: booking.modelId,
      clientId: booking.clientId
    },
    status: booking.status || 'pending',
    created_at: booking.createdAt,
    price_amount: booking.priceAmount,
    amount: booking.priceAmount,
    pdf_summary_url: booking.pdfSummaryUrl || null,
    pdf_generated_at: booking.pdfGeneratedAt || null,
    is_shared_with_client: booking.isSharedWithClient || false,
    clientId: booking.clientId,
    clientName: booking.clientName,
    modelId: booking.modelId,
    modelName: booking.modelName,
    modelImage: booking.modelImage,
    priceAmount: booking.priceAmount
  });
}

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
    let backendBookings: Booking[] = [];
    try {
      const res = await fetch('/api/v2/bookings');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          backendBookings = json.data.map(fromSupabaseBookingRow);
        }
      }
    } catch (e) {
      console.warn('Backend API bookings fetch note:', e);
    }

    let dbBookings: Booking[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && data) {
          dbBookings = data.map(fromSupabaseBookingRow);
        }
      } catch (e) {
        console.error('Supabase bookings fetch failed', e);
      }
    }
    let localBookings: Booking[] = [];
    try {
      const local = localStorage.getItem('mvi_bookings');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          localBookings = parsed.filter(b => !['b1', 'b2', 'b3', 'b4'].includes(b.id));
        }
      }
    } catch (e) {
      console.warn('LocalStorage read note:', e);
    }

    const mergedMap = new Map<string, Booking>();
    localBookings.forEach(b => mergedMap.set(b.id, b));
    backendBookings.forEach(b => mergedMap.set(b.id, b));
    dbBookings.forEach(b => mergedMap.set(b.id, b)); // Supabase Database takes precedence

    return Array.from(mergedMap.values());
  },

  async addBooking(booking: Booking): Promise<void> {
    try {
      const local = localStorage.getItem('mvi_bookings');
      const existing: Booking[] = local ? JSON.parse(local) : [];
      const idx = existing.findIndex(b => b.id === booking.id);
      if (idx >= 0) {
        existing[idx] = booking;
      } else {
        existing.push(booking);
      }
      localStorage.setItem('mvi_bookings', JSON.stringify(existing));
    } catch (localErr) {
      console.error('Local storage addBooking failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await ensureUserExistsInDb(booking.clientId, booking.clientName, undefined, SEED_USERS);
        await ensureModelExistsInDb(booking.modelId, SEED_MODELS);
        const row = toSupabaseBookingRow(booking);
        const { error } = await supabase
          .from('bookings')
          .upsert(row);
        if (error) throw error;
        console.log(`Booking ${booking.id} saved to Supabase successfully.`);
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
          .update({ status, updated_at: new Date().toISOString() })
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
            pdf_summary_url: pdfSummaryUrl,
            pdf_generated_at: new Date().toISOString(),
            is_shared_with_client: isSharedWithClient
          })
          .eq('id', bookingId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase bookings update PDF summary failed (falling back to local):', e);
      }
    }
  }
};
