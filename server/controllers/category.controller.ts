/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';

const categoryService = new CategoryService();

export class CategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      const list = await categoryService.getAllCategories();
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      return res.status(200).json({ success: true, data: category });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { id, name, description } = req.body;
      if (!id || !name) {
        return res.status(400).json({ success: false, error: 'Category ID and Name are required.' });
      }
      const saved = await categoryService.createCategory({ id, name, description });
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await categoryService.updateCategory(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Category not found for update.' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await categoryService.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }
      return res.status(200).json({ success: true, message: 'Category deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
