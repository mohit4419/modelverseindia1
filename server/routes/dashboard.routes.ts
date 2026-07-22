/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/dashboard/stats', DashboardController.getStats);
router.get('/dashboard/recent-bookings', DashboardController.getRecentBookings);
router.get('/dashboard/earnings', DashboardController.getEarnings);

export default router;
