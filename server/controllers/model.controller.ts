/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ModelService } from '../services/model.service';
import { Model } from '../types';

const modelService = new ModelService();

export class ModelController {
  static async getModels(req: Request, res: Response) {
    try {
      const approvedOnly = req.query.approved === 'true';
      const models = await modelService.getAllModels(approvedOnly);
      return res.status(200).json({ success: true, data: models });
    } catch (err: any) {
      console.error('Error in getModels controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getModelById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const model = await modelService.getModelById(id);
      if (!model) {
        return res.status(404).json({ success: false, error: 'Model not found' });
      }
      return res.status(200).json({ success: true, data: model });
    } catch (err: any) {
      console.error('Error in getModelById controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveModel(req: Request, res: Response) {
    try {
      const modelData: Model = req.body;
      if (!modelData || !modelData.id) {
        return res.status(400).json({ success: false, error: 'Invalid model data' });
      }
      const saved = await modelService.createModel(modelData);
      return res.status(200).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error in saveModel controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await modelService.updateModel(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Model not found for update' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error in updateModel controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await modelService.deleteModel(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Model not found' });
      }
      return res.status(200).json({ success: true, message: 'Model deleted successfully' });
    } catch (err: any) {
      console.error('Error in deleteModel controller:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await modelService.updateModel(id, { status });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Model not found' });
      }
      return res.status(200).json({ success: true, data: updated, message: 'Model status updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { availability } = req.body;
      const updated = await modelService.updateModel(id, { availability });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Model not found' });
      }
      return res.status(200).json({ success: true, data: updated, message: 'Model availability updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async searchModels(req: Request, res: Response) {
    try {
      const q = (req.query.q || '') as string;
      const results = await modelService.searchModels(q);
      return res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getFeatured(req: Request, res: Response) {
    try {
      const results = await modelService.getFeaturedModels();
      return res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getTrending(req: Request, res: Response) {
    try {
      const results = await modelService.getTrendingModels();
      return res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getVerified(req: Request, res: Response) {
    try {
      const results = await modelService.getVerifiedModels();
      return res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getByCategory(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const results = await modelService.getModelsByCategory(slug);
      return res.status(200).json({ success: true, data: results });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
