/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Model } from '../../types';
import { isSupabaseAvailable, removeUndefined, sanitizeValue, fromSupabaseModelRow } from './helpers';
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
      const response = await fetch('/api/v2/models');
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
        if (!error && data && Array.isArray(data)) {
          dbModels = data.map(fromSupabaseModelRow);
        }
      } catch (e) {
        console.error('Supabase models fetch failed, using fallback', e);
      }
    }
    const local = localStorage.getItem('mvi_models');
    const localModels: Model[] = local ? JSON.parse(local) : SEED_MODELS;

    const mergedMap = new Map<string, Model>();
    // Priority sequence:
    // 1. Seed Models
    SEED_MODELS.forEach(m => mergedMap.set(m.id, m));
    // 2. Supabase Database Models (parsed)
    dbModels.forEach(m => mergedMap.set(m.id, m));
    // 3. LocalStorage Cached Models
    localModels.forEach(m => mergedMap.set(m.id, m));
    // 4. Express Server Backend Models (Highest Priority - Primary Source of Truth)
    backendModels.forEach(m => mergedMap.set(m.id, m));

    const finalModels = Array.from(mergedMap.values()).map(m => ({
      ...m,
      approved: m.approved !== undefined ? m.approved : true,
      category: m.category || 'Fashion Models',
      portfolio: Array.isArray(m.portfolio) && m.portfolio.length > 0 
        ? m.portfolio 
        : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'],
      startingPrice: m.startingPrice || 15000,
      available: m.available !== undefined ? m.available : (m.availabilityStatus === 'Available')
    }));

    return sanitizeValue(finalModels);
  },

  // ADD OR UPDATE MODEL (Backend First)
  async saveModel(model: Model): Promise<Model> {
    // 1. Send to Express backend FIRST
    const response = await fetch('/api/v2/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(model)
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.error || `Backend failed with HTTP ${response.status}`);
    }

    const result = await response.json();
    const savedModel: Model = (result && result.data) ? result.data : model;

    // 2. Save to Supabase if configured
    if (isSupabaseAvailable && supabase) {
      try {
        const { error } = await supabase
          .from('models')
          .upsert(removeUndefined(savedModel));
        if (error) console.warn('Supabase upsert warning:', error.message);
      } catch (e) {
        console.warn('Supabase saveModel error:', e);
      }
    }

    // 3. Cache in localStorage
    try {
      const currentLocal = localStorage.getItem('mvi_models');
      const models: Model[] = currentLocal ? JSON.parse(currentLocal) : [];
      const idx = models.findIndex(m => m.id === savedModel.id);
      if (idx >= 0) {
        models[idx] = savedModel;
      } else {
        models.push(savedModel);
      }
      localStorage.setItem('mvi_models', JSON.stringify(models));
    } catch (localErr) {
      console.error('Local storage saveModel failed:', localErr);
    }

    return savedModel;
  },

  // REGISTER MODEL VIA BACKEND ROUTE HANDLER
  async registerModel(model: Model): Promise<Model> {
    const response = await fetch('/api/v2/models/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(model)
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.error || `Registration failed on server database with HTTP ${response.status}`);
    }

    const result = await response.json();
    const savedModel: Model = (result && result.data) ? result.data : model;
    if (savedModel.approved === undefined) savedModel.approved = true;

    // Optional Supabase sync
    if (isSupabaseAvailable && supabase) {
      try {
        const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const row: Record<string, any> = {
          name: savedModel.name,
          gender: savedModel.gender,
          city: savedModel.city,
          state: savedModel.state,
          starting_price: savedModel.startingPrice,
          rating: savedModel.rating,
          reviews_count: savedModel.reviewsCount,
          biography: savedModel.biography,
          phone: savedModel.phone,
          email: savedModel.email,
          languages: savedModel.languages,
          experience: savedModel.experience,
          availabilityStatus: savedModel.availabilityStatus,
          measurements: {
            ...(savedModel.measurements || {}),
            category: savedModel.category,
            portfolio: savedModel.portfolio,
            agencyInfo: savedModel.agencyInfo,
            additionalDetails: savedModel.additionalDetails,
            socialLinks: savedModel.socialLinks,
            selfieUrl: savedModel.selfieUrl,
            selfieVerified: savedModel.selfieVerified !== undefined ? savedModel.selfieVerified : true,
            approved: savedModel.approved !== undefined ? savedModel.approved : true,
            rejected: savedModel.rejected !== undefined ? savedModel.rejected : false,
            originalId: savedModel.id,
            originalUserId: savedModel.userId
          }
        };
        if (isUuid(savedModel.id)) row.id = savedModel.id;
        if (isUuid(savedModel.userId)) row.userId = savedModel.userId;

        const { error } = await supabase
          .from('models')
          .upsert(removeUndefined(row));
        if (error) console.warn('Client Supabase upsert note on registration:', error.message);
      } catch (e) {
        console.warn('Client Supabase registerModel catch:', e);
      }
    }

    // LocalStorage cache
    try {
      const currentLocal = localStorage.getItem('mvi_models');
      const models: Model[] = currentLocal ? JSON.parse(currentLocal) : [];
      const idx = models.findIndex(m => m.id === savedModel.id);
      if (idx >= 0) {
        models[idx] = savedModel;
      } else {
        models.push(savedModel);
      }
      localStorage.setItem('mvi_models', JSON.stringify(models));
    } catch (localErr) {
      console.error('Local storage registerModel failed:', localErr);
    }

    return savedModel;
  }
};
