/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/analytics/revenue', DashboardController.getRevenueAnalytics);
router.get('/analytics/signups', DashboardController.getSignupAnalytics);

export default router;
