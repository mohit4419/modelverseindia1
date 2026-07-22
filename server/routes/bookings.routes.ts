/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validateBody } from '../middleware/validate';
import { bookingSchema } from '../validators/booking.validator';

const router = Router();

router.get('/bookings', BookingController.getBookings);
router.get('/bookings/client/:id', BookingController.getByClientId);
router.get('/bookings/model/:id', BookingController.getByModelId);

router.get('/bookings/:id', BookingController.getBookingById);
router.post('/bookings', validateBody(bookingSchema), BookingController.createBooking);
router.patch('/bookings/:id', BookingController.updateBooking);
router.put('/bookings/:id', BookingController.updateBooking);
router.patch('/bookings/:id/status', BookingController.updateBookingStatus);
router.put('/bookings/:id/status', BookingController.updateBookingStatus);
router.delete('/bookings/:id', BookingController.deleteBooking);

// Backward Compatibility
router.put('/bookings/:id/share', BookingController.shareWithClient);

export default router;
