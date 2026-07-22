/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const createSessionSchema = z.object({
  gateway: z.string().optional(),
  planType: z.string().min(1, { message: 'Plan type is required.' }),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  modelId: z.string().optional(),
  modelName: z.string().optional(),
  amount: z.number().optional(),
});

export const verifyPaymentSchema = z.object({
  gateway: z.string().optional(),
  sessionId: z.string().optional(),
  planType: z.string().optional(),
  amount: z.number().optional(),
  modelId: z.string().optional(),
  modelName: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_order_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
});
