/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { Booking } from '../types';

const LOCAL_BOOKINGS_FILE = path.join(process.cwd(), 'local_bookings.json');

function getLocalBookings(): Booking[] {
  try {
    if (fs.existsSync(LOCAL_BOOKINGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_BOOKINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local bookings file:', e);
  }
  return [];
}

function saveLocalBookings(bookings: Booking[]) {
  try {
    fs.writeFileSync(LOCAL_BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local bookings file:', e);
  }
}

// Map Supabase snake_case row → app camelCase Booking object
function fromSupabaseRow(b: any): Booking {
  return {
    id: b.id,
    clientId: b.client_id || b.clientId || '',
    clientName: b.client_name || b.clientName || '',
    modelId: b.model_id || b.modelId || '',
    modelName: b.model_name || b.modelName || '',
    modelImage: b.model_image || b.modelImage || '',
    projectDetails: b.project_details || b.projectDetails || {},
    status: b.status || 'pending',
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
    priceAmount: Number(b.price_amount || b.priceAmount || b.amount || 0),
    pdfSummaryUrl: b.pdf_summary_url || b.pdfSummaryUrl,
    pdfGeneratedAt: b.pdf_generated_at || b.pdfGeneratedAt,
    isSharedWithClient: b.is_shared_with_client || b.isSharedWithClient || false,
  };
}

// Map app camelCase Booking → Supabase snake_case row for upsert
function toSupabaseRow(booking: Booking): Record<string, any> {
  const row: Record<string, any> = {
    id: booking.id,
    client_id: booking.clientId,
    client_name: booking.clientName,
    model_id: booking.modelId,
    model_name: booking.modelName,
    model_image: booking.modelImage,
    project_details: booking.projectDetails,
    status: booking.status || 'pending',
    created_at: booking.createdAt,
    price_amount: booking.priceAmount,
    amount: booking.priceAmount,
  };
  // Optional fields
  if (booking.pdfSummaryUrl !== undefined) row.pdf_summary_url = booking.pdfSummaryUrl;
  if (booking.pdfGeneratedAt !== undefined) row.pdf_generated_at = booking.pdfGeneratedAt;
  if (booking.isSharedWithClient !== undefined) row.is_shared_with_client = booking.isSharedWithClient;
  return row;
}

export class BookingRepository {
  async findAll(): Promise<Booking[]> {
    let dbBookings: Booking[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('bookings').select('*'),
          2500
        );
        if (!error && data) {
          dbBookings = data.map(fromSupabaseRow);
        }
      } catch (e) {
        console.error('Supabase booking query failed:', e);
      }
    }

    const localBookings = getLocalBookings();
    const mergedMap = new Map<string, Booking>();
    localBookings.forEach((b) => mergedMap.set(b.id, b));
    dbBookings.forEach((b) => mergedMap.set(b.id, b));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Booking | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('bookings').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return fromSupabaseRow(data);
        }
      } catch (e) {
        console.error(`Supabase query for booking ${id} failed:`, e);
      }
    }

    const localBookings = getLocalBookings();
    return localBookings.find((b) => b.id === id) || null;
  }

  async save(booking: Booking): Promise<Booking> {
    const localBookings = getLocalBookings();
    const idx = localBookings.findIndex((b) => b.id === booking.id);
    if (idx >= 0) {
      localBookings[idx] = booking;
    } else {
      localBookings.push(booking);
    }
    saveLocalBookings(localBookings);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = toSupabaseRow(booking);
        const { error } = await withTimeout(
          supabaseAdmin.from('bookings').upsert(row),
          2500
        );
        if (error) throw error;
        console.log(`Booking ${booking.id} successfully saved to Supabase.`);
      } catch (e: any) {
        console.warn(`Supabase upsert failed for booking ${booking.id}:`, e.message || e);
      }
    }

    return booking;
  }

  async delete(id: string): Promise<boolean> {
    const localBookings = getLocalBookings();
    const filtered = localBookings.filter((b) => b.id !== id);
    if (filtered.length !== localBookings.length) {
      saveLocalBookings(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('bookings').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for booking ${id}:`, e);
      }
    }

    return filtered.length !== localBookings.length;
  }
}
