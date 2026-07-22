/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  phone_number: z.string().optional().refine(val => {
    if (!val) return true;
    const cleanNum = val.trim().replace(/[\s-()]/g, '');
    return /^\+?[1-9]\d{6,14}$/.test(cleanNum);
  }, {
    message: 'Invalid phone number format. Please provide a valid number containing 7 to 15 digits.'
  }),
  name: z.string().optional(),
  role: z.enum(['client', 'model', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
