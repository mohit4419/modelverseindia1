/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillRepository, Skill } from '../repositories/skill.repository';

export class SkillService {
  private skillRepository = new SkillRepository();

  async getAllSkills(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }

  async getSkillById(id: string): Promise<Skill | null> {
    return this.skillRepository.findById(id);
  }

  async createSkill(skillData: Skill): Promise<Skill> {
    return this.skillRepository.save(skillData);
  }

  async updateSkill(id: string, updates: Partial<Skill>): Promise<Skill | null> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) return null;

    const updated = {
      ...skill,
      ...updates,
      id, // Preserve id
    };

    return this.skillRepository.save(updated);
  }

  async deleteSkill(id: string): Promise<boolean> {
    return this.skillRepository.delete(id);
  }
}
