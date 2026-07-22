/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const bookingSchema = z.object({
  id: z.string().min(1, { message: 'Booking ID is required.' }),
  clientId: z.string().min(1, { message: 'Client ID is required.' }),
  clientName: z.string().min(1, { message: 'Client Name is required.' }),
  modelId: z.string().min(1, { message: 'Model ID is required.' }),
  modelName: z.string().min(1, { message: 'Model Name is required.' }),
  modelImage: z.string().min(1, { message: 'Model Image URL is required.' }),
  projectDetails: z.record(z.string(), z.any()),
  status: z.enum(['pending', 'assigned', 'accepted', 'rejected', 'canceled', 'completed']),
  createdAt: z.string().min(1, { message: 'Creation Timestamp is required.' }),
  priceAmount: z.number().positive('Amount must be greater than zero.'),
});
