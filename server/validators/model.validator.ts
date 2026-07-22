/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const modelSchema = z.object({
  id: z.string().min(1, { message: 'Model ID is required.' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
  name: z.string().min(1, { message: 'Model Name is required.' }),
  gender: z.string().optional(),
  age: z.number().int().positive().optional(),
  height: z.union([z.string(), z.number()]).optional(),
  city: z.string().min(1, { message: 'City is required.' }),
  state: z.string().min(1, { message: 'State is required.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  languages: z.array(z.string()).optional(),
  experience: z.string().optional(),
  portfolio: z.array(z.string()).optional(),
  startingPrice: z.number().optional(),
  biography: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
