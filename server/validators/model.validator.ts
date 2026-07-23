/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const modelSchema = z.object({
  id: z.string().min(1, { message: 'Model ID is required.' }),
  userId: z.string().optional().default('u_guest'),
  name: z.string().min(1, { message: 'Model Name is required.' }),
  gender: z.string().optional(),
  age: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  category: z.string().optional(),
  languages: z.array(z.string()).optional(),
  experience: z.string().optional(),
  portfolio: z.array(z.string()).optional(),
  startingPrice: z.union([z.number(), z.string()]).optional(),
  biography: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
}).passthrough();
