/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Model } from '../../types';
import { isSupabaseAvailable, removeUndefined, sanitizeValue } from './helpers';
import { SEED_MODELS } from './seedData';

export const modelService = {
  // REAL-TIME COLLECTIONS SUBSCRIPTIONS
  subscribeToModels(callback: (models: Model[]) => void): () => void {
    if (isSupabaseAvailable && supabase) {
      const channel = supabase
        .channel('schema-db-changes-models')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'models' },
          async () => {
            const fresh = await this.getModels();
            callback(fresh);
          }
        )
        .subscribe();

      this.getModels().then(callback);

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      this.getModels().then(callback);
      return () => {};
    }
  },

  // GET MODELS
  async getModels(): Promise<Model[]> {
    let backendModels: Model[] = [];
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          backendModels = result.data as Model[];
        }
      }
    } catch (e) {
      console.error('Failed to fetch models from Express backend:', e);
    }

    let dbModels: Model[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('models').select('*');
        if (!error && data) {
          dbModels = data as Model[];
        }
      } catch (e) {
        console.error('Supabase models fetch failed, using fallback', e);
      }
    }
    const local = localStorage.getItem('mvi_models');
    const localModels: Model[] = local ? JSON.parse(local) : SEED_MODELS;

    const mergedMap = new Map<string, Model>();
    SEED_MODELS.forEach(m => mergedMap.set(m.id, m));
    localModels.forEach(m => mergedMap.set(m.id, m));
    backendModels.forEach(m => mergedMap.set(m.id, m));
    dbModels.forEach(m => mergedMap.set(m.id, m));

    const finalModels = Array.from(mergedMap.values()).map(m => ({
      ...m,
      available: m.available !== undefined ? m.available : (m.availabilityStatus === 'Available')
    }));

    return sanitizeValue(finalModels);
  },

  // ADD OR UPDATE MODEL
  async saveModel(model: Model): Promise<void> {
    try {
      const models = await this.getModels();
      const idx = models.findIndex(m => m.id === model.id);
      if (idx >= 0) {
        models[idx] = model;
      } else {
        models.push(model);
      }
      localStorage.setItem('mvi_models', JSON.stringify(models));
    } catch (localErr) {
      console.error('Local storage saveModel failed:', localErr);
    }

    // Save to Express backend (which handles local file and Supabase)
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(model)
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to save model to Express backend:', err);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        const dbModel = {
  id: model.id,
  userId: model.userId,
  name: model.name,
  gender: model.gender,
  age: model.age,
  height: model.height ? Number(model.height) : null,
  city: model.city,
  state: model.state,

  phone: model.phone,
  email: model.email,
  languages: model.languages,
  experience: model.experience,
  videoUrl: model.videoUrl,
  availabilityStatus: model.availabilityStatus,

  measurements: model.measurements,
  chest: model.measurements?.bust,
  waist: model.measurements?.waist,
  hips: model.measurements?.hips,

  shoeSize: model.additionalDetails?.shoeSize,
  eyeColor: model.additionalDetails?.eyeColor,
  hairColor: model.additionalDetails?.hairColor,
  skinTone: model.additionalDetails?.skinTone,

  instagramUrl: model.socialLinks?.instagram,

  biography: model.biography,
  starting_price: model.startingPrice
  ? Number(model.startingPrice)
  : null,
  rating: model.rating ?? null,
reviews_count: model.reviewsCount ?? null,
  

  

  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const { error } = await supabase
  .from("models")
  .upsert(removeUndefined(dbModel));

if (error) {
  console.error(error);
  throw error;
}
        
        console.log(`Successfully upserted model details for ${model.id} in Supabase`);
      } catch (e) {
        console.warn('Supabase saveModel failed, falling back to local storage and memory:', e);
      }
    }
  }
};
