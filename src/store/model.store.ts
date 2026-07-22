import { Model } from '../types';

let cachedModels: Model[] = [];

export const modelStore = {
  getModels(): Model[] {
    return cachedModels;
  },

  setModels(models: Model[]): void {
    cachedModels = models;
  },

  addModel(model: Model): void {
    cachedModels.push(model);
  }
};
