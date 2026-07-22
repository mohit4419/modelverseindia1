/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { SkillService } from '../services/skill.service';

const skillService = new SkillService();

export class SkillController {
  static async getSkills(req: Request, res: Response) {
    try {
      const list = await skillService.getAllSkills();
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSkillById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const skill = await skillService.getSkillById(id);
      if (!skill) {
        return res.status(404).json({ success: false, error: 'Skill not found.' });
      }
      return res.status(200).json({ success: true, data: skill });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSkill(req: Request, res: Response) {
    try {
      const { id, name, categoryId } = req.body;
      if (!id || !name) {
        return res.status(400).json({ success: false, error: 'Skill ID and Name are required.' });
      }
      const saved = await skillService.createSkill({ id, name, categoryId });
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSkill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await skillService.updateSkill(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Skill not found for update.' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteSkill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await skillService.deleteSkill(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Skill not found.' });
      }
      return res.status(200).json({ success: true, message: 'Skill deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
