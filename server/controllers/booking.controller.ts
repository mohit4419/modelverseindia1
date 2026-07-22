/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { Booking } from '../types';

const bookingService = new BookingService();

export class BookingController {
  static async getBookings(req: Request, res: Response) {
    try {
      const clientId = req.query.clientId as string;
      const modelId = req.query.modelId as string;

      let bookings: Booking[] = [];
      if (clientId) {
        bookings = await bookingService.getBookingsByClient(clientId);
      } else if (modelId) {
        bookings = await bookingService.getBookingsByModel(modelId);
      } else {
        bookings = await bookingService.getAllBookings();
      }

      return res.status(200).json({ success: true, data: bookings });
    } catch (err: any) {
      console.error('Error in getBookings controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      return res.status(200).json({ success: true, data: booking });
    } catch (err: any) {
      console.error('Error in getBookingById controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createBooking(req: Request, res: Response) {
    try {
      const bookingData: Booking = req.body;
      if (!bookingData || !bookingData.id) {
        return res.status(400).json({ success: false, error: 'Invalid booking data' });
      }
      const saved = await bookingService.createBooking(bookingData);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error in createBooking controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }
      const updated = await bookingService.updateBookingStatus(id, status);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error in updateBookingStatus controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async shareWithClient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isShared } = req.body;
      const updated = await bookingService.shareWithClient(id, isShared !== false);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error in shareWithClient controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await bookingService.updateBooking(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Booking not found for update' });
      }
      return res.status(200).json({ success: true, data: updated, message: 'Booking updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await bookingService.deleteBooking(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Booking not found for deletion' });
      }
      return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getByClientId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bookings = await bookingService.getBookingsByClient(id);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getByModelId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const bookings = await bookingService.getBookingsByModel(id);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
