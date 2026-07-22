import { Booking } from '../types';

let cachedBookings: Booking[] = [];

export const bookingStore = {
  getBookings(): Booking[] {
    return cachedBookings;
  },

  setBookings(bookings: Booking[]): void {
    cachedBookings = bookings;
  },

  addBooking(booking: Booking): void {
    cachedBookings.unshift(booking);
  }
};
