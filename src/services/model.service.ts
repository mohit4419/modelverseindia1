import { modelsApi } from '../api/models.api';

export const modelService = {
  async getModels(approvedOnly = true) {
    return modelsApi.getModels(approvedOnly);
  },

  async getModelById(id: string) {
    return modelsApi.getModelById(id);
  },

  async searchModels(query: string) {
    return modelsApi.searchModels(query);
  },

  async saveModel(model: any) {
    return modelsApi.saveModel(model);
  }
};
