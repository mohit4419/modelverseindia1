/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/admin';
import { verifyToken } from '../middleware/auth';

const router = Router();

// New V1 Admin Routes
router.get('/admin/dashboard', verifyToken as any, requireAdmin as any, AdminController.getDashboard);
router.get('/admin/models/pending', verifyToken as any, requireAdmin as any, AdminController.getPendingModels);
router.patch('/admin/models/:id/approve', verifyToken as any, requireAdmin as any, AdminController.approveModel);
router.get('/admin/verification-requests', verifyToken as any, requireAdmin as any, AdminController.getVerificationRequests);
router.patch('/admin/verification-requests/:id/approve', verifyToken as any, requireAdmin as any, AdminController.approveVerificationRequest);

// Backward Compatibility
router.get('/admin/stats', verifyToken as any, requireAdmin as any, AdminController.getDashboardStats);
router.post('/admin/approve-model/:id', verifyToken as any, requireAdmin as any, AdminController.approveModel);

export default router;
