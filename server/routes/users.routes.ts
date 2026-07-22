/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/users/profile', verifyToken as any, AuthController.getCurrentUserProfile);
router.patch('/users/profile', verifyToken as any, AuthController.updateCurrentUserProfile);
router.patch('/users/password', verifyToken as any, AuthController.updateCurrentUserPassword);
router.patch('/users/avatar', verifyToken as any, AuthController.updateCurrentUserAvatar);
router.delete('/users/account', verifyToken as any, AuthController.deleteCurrentUserAccount);
router.get('/users/dashboard', verifyToken as any, AuthController.getCurrentUserDashboard);

// Backward Compatibility
router.get('/users/profile/:id', AuthController.getProfile);

export default router;
