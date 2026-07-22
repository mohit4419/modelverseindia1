import { bookingsApi } from '../api/bookings.api';

export const bookingService = {
  async getBookings(params?: { clientId?: string; modelId?: string }) {
    return bookingsApi.getBookings(params);
  },

  async getBookingById(id: string) {
    return bookingsApi.getBookingById(id);
  },

  async createBooking(data: any) {
    return bookingsApi.createBooking(data);
  }
};
