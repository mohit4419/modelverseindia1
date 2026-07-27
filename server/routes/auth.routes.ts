/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/auth/status', AuthController.getSupabaseStatus);
router.post('/auth/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/auth/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/refresh-token', AuthController.refreshToken);
router.post('/auth/send-signup-otp', AuthController.sendSignupOtp);
router.post('/auth/verify-signup-otp', AuthController.verifySignupOtp);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/verify-reset-otp', AuthController.verifyResetOtp);
router.post('/auth/reset-password', AuthController.resetPassword);
router.post('/auth/verify-email', AuthController.verifyEmail);
router.get('/auth/me', verifyToken as any, AuthController.me);
router.get('/auth/profile/:id', AuthController.getProfile);

export default router;
