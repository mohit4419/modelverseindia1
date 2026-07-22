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
          dbBookings = data.map((b: any) => ({
            id: b.id,
            clientId: b.clientId,
            clientName: b.clientName,
            modelId: b.modelId,
            modelName: b.modelName,
            modelImage: b.modelImage,
            projectDetails: b.projectDetails || {},
            status: b.status,
            createdAt: b.createdAt,
            priceAmount: b.priceAmount,
            pdfSummaryUrl: b.pdfSummaryUrl,
            pdfGeneratedAt: b.pdfGeneratedAt,
            isSharedWithClient: b.isSharedWithClient,
          })) as Booking[];
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
          return {
            id: data.id,
            clientId: data.clientId,
            clientName: data.clientName,
            modelId: data.modelId,
            modelName: data.modelName,
            modelImage: data.modelImage,
            projectDetails: data.projectDetails || {},
            status: data.status,
            createdAt: data.createdAt,
            priceAmount: data.priceAmount,
            pdfSummaryUrl: data.pdfSummaryUrl,
            pdfGeneratedAt: data.pdfGeneratedAt,
            isSharedWithClient: data.isSharedWithClient,
          } as Booking;
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
        const { error } = await withTimeout(
          supabaseAdmin.from('bookings').upsert({
            id: booking.id,
            clientId: booking.clientId,
            clientName: booking.clientName,
            modelId: booking.modelId,
            modelName: booking.modelName,
            modelImage: booking.modelImage,
            projectDetails: booking.projectDetails,
            status: booking.status,
            createdAt: booking.createdAt,
            priceAmount: booking.priceAmount,
            pdfSummaryUrl: booking.pdfSummaryUrl || null,
            pdfGeneratedAt: booking.pdfGeneratedAt || null,
            isSharedWithClient: booking.isSharedWithClient || false,
          }),
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
