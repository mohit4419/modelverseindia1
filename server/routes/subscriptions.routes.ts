/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();

router.post('/subscriptions/subscribe', SubscriptionController.subscribe as any);
router.post('/subscriptions/cancel', SubscriptionController.cancel as any);
router.get('/subscriptions/status', SubscriptionController.getStatus as any);
router.get('/subscriptions/plans', SubscriptionController.getPlans as any);

export default router;
