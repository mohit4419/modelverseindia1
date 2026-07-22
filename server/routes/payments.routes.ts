/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validateBody } from '../middleware/validate';
import { createSessionSchema, verifyPaymentSchema } from '../validators/payment.validator';

const router = Router();

// New V1 payments API
router.post('/payments/create-order', PaymentController.createOrder);
router.post('/payments/verify', PaymentController.verifyPayment);
router.post('/payments/webhook', PaymentController.handleRazorpayWebhook);
router.get('/payments/history', PaymentController.getHistory);
router.post('/payments/refund', PaymentController.refund);
router.get('/payments/invoice/:id', PaymentController.getInvoice);
router.get('/payments/:id', PaymentController.getPaymentById);

// Backward Compatibility
router.post('/payments/create-session', validateBody(createSessionSchema), PaymentController.createSession);
router.get('/payments/pending-unlocks', PaymentController.getPendingUnlocks);
router.post('/webhook/razorpay', PaymentController.handleRazorpayWebhook);

export default router;
