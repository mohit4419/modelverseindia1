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
         dbBookings = data.map((row: any) => ({
  id: row.id,
  bookingNumber: row.booking_number,
  clientId: row.client_id,
  modelId: row.model_id,
  projectTitle: row.project_title,
  projectType: row.project_type,
  eventType: row.event_type,
  bookingDate: row.booking_date,
  startDate: row.start_date,
  endDate: row.end_date,
  startTime: row.start_time,
  endTime: row.end_time,
  numberOfModels: row.number_of_models,
  location: row.location,
  amount: Number(row.amount),
  paymentStatus: row.payment_status,
  advanceAmount: Number(row.advance_amount),
  specialRequirements: row.special_requirements,
  clientNotes: row.client_notes,
  modelNotes: row.model_notes,
  status: row.status,
  projectDetails: row.project_details || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
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
  bookingNumber: data.booking_number,
  clientId: data.client_id,
  modelId: data.model_id,
  projectTitle: data.project_title,
  projectType: data.project_type,
  eventType: data.event_type,
  bookingDate: data.booking_date,
  startDate: data.start_date,
  endDate: data.end_date,
  startTime: data.start_time,
  endTime: data.end_time,
  numberOfModels: data.number_of_models,
  location: data.location,
  amount: Number(data.amount),
  paymentStatus: data.payment_status,
  advanceAmount: Number(data.advance_amount),
  specialRequirements: data.special_requirements,
  clientNotes: data.client_notes,
  modelNotes: data.model_notes,
  status: data.status,
  projectDetails: data.project_details || {},
  createdAt: data.created_at,
  updatedAt: data.updated_at,
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
          supabaseAdmin.from('bookings').upsert(
            {
  id: booking.id,
  booking_number: booking.bookingNumber,
  client_id: booking.clientId,
  model_id: booking.modelId,
  project_title: booking.projectTitle,
  project_type: booking.projectType,
  event_type: booking.eventType,
  booking_date: booking.bookingDate,
  start_date: booking.startDate,
  end_date: booking.endDate,
  start_time: booking.startTime,
  end_time: booking.endTime,
  number_of_models: booking.numberOfModels,
  location: booking.location,
  amount: booking.amount,
  payment_status: booking.paymentStatus,
  advance_amount: booking.advanceAmount,
  special_requirements: booking.specialRequirements,
  client_notes: booking.clientNotes,
  model_notes: booking.modelNotes,
  status: booking.status,
  project_details: booking.projectDetails,
  created_at: booking.createdAt,
  updated_at: booking.updatedAt,
}
          ),
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
