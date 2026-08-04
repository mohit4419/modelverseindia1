/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const bookingSchema = z.object({
  id: z.string().min(1, { message: 'Booking ID is required.' }),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  modelId: z.string().min(1, { message: 'Model ID is required.' }),
  modelName: z.string().optional(),
  modelImage: z.string().optional(),
  projectDetails: z.record(z.string(), z.any()).optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  priceAmount: z.number().optional(),
});
