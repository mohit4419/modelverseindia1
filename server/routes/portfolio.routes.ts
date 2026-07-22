/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';

const router = Router();

router.get('/portfolio', PortfolioController.getPortfolioItems);
router.post('/portfolio/images', PortfolioController.saveImages);
router.post('/portfolio/videos', PortfolioController.saveVideos);

router.get('/portfolio/:modelId', PortfolioController.getByModelId);
router.patch('/portfolio/:id', PortfolioController.updateItem);
router.delete('/portfolio/:id', PortfolioController.deletePortfolioItem);

export default router;
