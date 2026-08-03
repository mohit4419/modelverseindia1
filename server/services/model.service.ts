/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelRepository } from '../repositories/model.repository';
import { Model } from '../types';

export class ModelService {
  private modelRepository = new ModelRepository();

  async getAllModels(approvedOnly: boolean = false): Promise<Model[]> {
    const models = await this.modelRepository.findAll();
    if (approvedOnly) {
      return models.filter((m) => m.approved && !m.archived);
    }
    return models;
  }

  async getModelById(id: string): Promise<Model | null> {
    return this.modelRepository.findById(id);
  }

  async createModel(modelData: Model): Promise<Model> {
    return this.modelRepository.save(modelData);
  }

  async updateModel(id: string, updates: Partial<Model>): Promise<Model | null> {
    const existing = await this.modelRepository.findById(id);
    if (!existing) return null;

    const updatedModel: Model = {
      ...existing,
      ...updates,
      id, // ensure id is never changed
    };

    return this.modelRepository.save(updatedModel);
  }

  // Delete method removed — models cannot be deleted, only edited

  async approveModel(id: string): Promise<Model | null> {
    return this.updateModel(id, { approved: true });
  }

  async searchModels(q: string): Promise<Model[]> {
    const models = await this.getAllModels(true);
    const query = q.toLowerCase().trim();
    if (!query) return models;
    return models.filter((m) => 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.category && m.category.toLowerCase().includes(query)) ||
      (m.city && m.city.toLowerCase().includes(query)) ||
      (m.experience && m.experience.toLowerCase().includes(query))
    );
  }

  async getFeaturedModels(): Promise<Model[]> {
    const models = await this.getAllModels(true);
    return models.filter((m) => m.featured);
  }

  async getTrendingModels(): Promise<Model[]> {
    const models = await this.getAllModels(true);
    // Use views or reviews to count popularity, or return verified/featured models as fallback
    return models.slice(0, 6);
  }

  async getVerifiedModels(): Promise<Model[]> {
    const models = await this.getAllModels(true);
    return models.filter((m) => m.verified || m.approved);
  }

  async getModelsByCategory(slug: string): Promise<Model[]> {
    const models = await this.getAllModels(true);
    return models.filter((m) => m.category && m.category.toLowerCase() === slug.toLowerCase());
  }
}
