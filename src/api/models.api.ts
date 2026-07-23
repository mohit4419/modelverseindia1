/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Model } from '../types';

export const modelsApi = {
  async getModels(approvedOnly: boolean = false): Promise<Model[]> {
    const response = await fetch(`/api/v2/models?approved=${approvedOnly}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch models');
    }
    return result.data;
  },

  async searchModels(query: string): Promise<Model[]> {
    const response = await fetch(`/api/v2/models/search?q=${encodeURIComponent(query)}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to search models');
    }
    return result.data;
  },

  async getModelById(id: string): Promise<Model> {
    const response = await fetch(`/api/v2/models/${id}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch model');
    }
    return result.data;
  },

  async saveModel(model: Model): Promise<Model> {
    const response = await fetch('/api/v2/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save model');
    }
    return result.data;
  },

  async registerModel(model: Model): Promise<Model> {
    const response = await fetch('/api/v2/models/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to register model');
    }
    return result.data;
  },

  async updateModel(id: string, updates: Partial<Model>): Promise<Model> {
    const response = await fetch(`/api/v2/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update model');
    }
    return result.data;
  },

  async deleteModel(id: string): Promise<boolean> {
    const response = await fetch(`/api/v2/models/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete model');
    }
    return result.success;
  }
};
