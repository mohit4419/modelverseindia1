/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { FavoriteService } from '../services/favorite.service';

const favoriteService = new FavoriteService();

export class FavoriteController {
  static async getFavorites(req: Request, res: Response) {
    try {
      const { clientId } = req.query;
      if (!clientId) {
        return res.status(400).json({ success: false, error: 'clientId query parameter is required.' });
      }
      const list = await favoriteService.getFavoritesByClient(clientId as string);
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async addFavorite(req: Request, res: Response) {
    try {
      const { clientId, modelId } = req.body;
      if (!clientId || !modelId) {
        return res.status(400).json({ success: false, error: 'clientId and modelId are required.' });
      }
      const saved = await favoriteService.addFavorite(clientId, modelId);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async removeFavorite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await favoriteService.removeFavorite(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Favorite item not found.' });
      }
      return res.status(200).json({ success: true, message: 'Favorite item removed successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
