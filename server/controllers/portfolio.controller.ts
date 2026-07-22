/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service';

const portfolioService = new PortfolioService();

export class PortfolioController {
  static async getPortfolioItems(req: Request, res: Response) {
    try {
      const { modelId } = req.query;
      let list;
      if (modelId) {
        list = await portfolioService.getPortfolioItemsByModel(modelId as string);
      } else {
        list = await portfolioService.getAllPortfolioItems();
      }
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPortfolioItemById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await portfolioService.getPortfolioItemById(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Portfolio item not found.' });
      }
      return res.status(200).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async savePortfolioItem(req: Request, res: Response) {
    try {
      const itemData = req.body;
      if (!itemData || !itemData.id || !itemData.modelId || !itemData.imageUrl) {
        return res.status(400).json({ success: false, error: 'Invalid portfolio item payload. id, modelId, and imageUrl are required.' });
      }
      const saved = await portfolioService.savePortfolioItem(itemData);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deletePortfolioItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await portfolioService.deletePortfolioItem(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Portfolio item not found.' });
      }
      return res.status(200).json({ success: true, message: 'Portfolio item deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getByModelId(req: Request, res: Response) {
    try {
      const { modelId } = req.params;
      const list = await portfolioService.getPortfolioItemsByModel(modelId);
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveImages(req: Request, res: Response) {
    try {
      const { modelId, imageUrls, caption } = req.body;
      if (!modelId || !imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ success: false, error: 'modelId and imageUrls (array) are required.' });
      }
      const savedItems = [];
      for (const url of imageUrls) {
        const item = await portfolioService.savePortfolioItem({
          id: Math.random().toString(36).substring(2, 11),
          modelId,
          imageUrl: url,
          type: 'image',
          caption: caption || '',
          createdAt: new Date().toISOString()
        });
        savedItems.push(item);
      }
      return res.status(201).json({ success: true, data: savedItems });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveVideos(req: Request, res: Response) {
    try {
      const { modelId, videoUrls, caption } = req.body;
      if (!modelId || !videoUrls || !Array.isArray(videoUrls)) {
        return res.status(400).json({ success: false, error: 'modelId and videoUrls (array) are required.' });
      }
      const savedItems = [];
      for (const url of videoUrls) {
        const item = await portfolioService.savePortfolioItem({
          id: Math.random().toString(36).substring(2, 11),
          modelId,
          imageUrl: url, // Video URL goes to imageUrl or videoUrl property
          type: 'video',
          caption: caption || '',
          createdAt: new Date().toISOString()
        });
        savedItems.push(item);
      }
      return res.status(201).json({ success: true, data: savedItems });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await portfolioService.updatePortfolioItem(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Portfolio item not found' });
      }
      return res.status(200).json({ success: true, data: updated, message: 'Portfolio item updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
