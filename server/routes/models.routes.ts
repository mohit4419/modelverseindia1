/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ModelController } from '../controllers/model.controller';
import { validateBody } from '../middleware/validate';
import { modelSchema } from '../validators/model.validator';
import { verifyToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

router.get('/models', ModelController.getModels);
router.get('/models/search', ModelController.searchModels);
router.get('/models/featured', ModelController.getFeatured);
router.get('/models/trending', ModelController.getTrending);
router.get('/models/verified', ModelController.getVerified);
router.get('/models/category/:slug', ModelController.getByCategory);

router.post('/models/register', ModelController.registerModel);

router.get('/models/:id', ModelController.getModelById);
router.post('/models', validateBody(modelSchema), ModelController.saveModel);
router.patch('/models/:id', ModelController.updateModel);
router.put('/models/:id', ModelController.updateModel);
router.delete('/models/:id', verifyToken as any, requireAdmin as any, ModelController.deleteModel);

router.patch('/models/:id/status', ModelController.updateStatus);
router.patch('/models/:id/availability', ModelController.updateAvailability);

export default router;
