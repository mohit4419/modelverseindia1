/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';

const router = Router();

router.get('/favorites', FavoriteController.getFavorites);
router.post('/favorites', FavoriteController.addFavorite);
router.delete('/favorites/:id', FavoriteController.removeFavorite);

export default router;
