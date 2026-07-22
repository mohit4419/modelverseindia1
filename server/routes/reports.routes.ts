/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();

router.post('/reports/dispute', ReportController.raiseDispute as any);
router.post('/reports/payout-request', ReportController.requestPayout as any);
router.get('/reports/payouts/:userId', ReportController.getPayoutsByUserId as any);

export default router;
