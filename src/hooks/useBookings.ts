/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useBooking } from '../context/BookingContext';

export function useBookings() {
  const {
    bookings,
    setBookings,
    showBookingWizard,
    setShowBookingWizard,
    targetModelForBooking,
    setTargetModelForBooking,
    handleOpenBookingWizard,
    handleBookingSubmit,
    handleUpdateBookingStatus
  } = useBooking();

  return {
    bookings,
    setBookings,
    showBookingWizard,
    setShowBookingWizard,
    targetModelForBooking,
    setTargetModelForBooking,
    handleOpenBookingWizard,
    handleBookingSubmit,
    handleUpdateBookingStatus
  };
}
