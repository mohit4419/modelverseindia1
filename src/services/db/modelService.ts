/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Model } from '../../types';
import { isSupabaseAvailable, removeUndefined, sanitizeValue, fromSupabaseModelRow, isUUID, ensureUserExistsInDb, getValidUserIdForModel, extractPortfolioFromRow, isDummyModel } from './helpers';

function ensureUuidFormat(id?: string): string {
  if (isUUID(id)) return id!;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback
    }
  }
  const hexStamp = Date.now().toString(16).padStart(12, '0').slice(-12);
  return `10000000-1000-4000-8000-${hexStamp}`;
}

function parseHeightToInteger(val?: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 173;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (cleaned.length >= 3) {
    const num = parseInt(cleaned, 10);
    if (num > 100 && num < 250) return num; // cm format
  }
  const ftMatch = String(val).match(/(\d+)['\s]*(\d*)/);
  if (ftMatch) {
    const feet = parseInt(ftMatch[1], 10) || 5;
    const inches = parseInt(ftMatch[2], 10) || 8;
    return Math.round((feet * 30.48) + (inches * 2.54));
  }
  return 173;
}

async function mapModelToSupabaseRow(model: Model): Promise<Record<string, any>> {
  const finalUuid = ensureUuidFormat(model.id);
  const validUserId = await getValidUserIdForModel(model.userId);
  const portfolioArr = Array.isArray(model.portfolio) ? model.portfolio.filter(Boolean) : [];
  return removeUndefined({
    id: finalUuid,
    userId: validUserId,
    name: model.name,
    gender: model.gender || 'female',
    age: Number(model.age) || 23,
    height: parseHeightToInteger(model.height),
    city: model.city || 'Mumbai',
    state: model.state || 'Maharashtra',
    languages: Array.isArray(model.languages) ? model.languages : ['English', 'Hindi'],
    experience: model.experience || 'Fresh Face',
    starting_price: Number(model.startingPrice || (model as any).starting_price) || 15000,
    approved: model.approved !== undefined ? Boolean(model.approved) : true,
    rejected: Boolean(model.rejected),
    selfie_verified: model.selfieVerified !== undefined ? Boolean(model.selfieVerified) : true,
    rating: Number(model.rating) || 5,
    reviews_count: Number(model.reviewsCount || (model as any).reviews_count) || 1,
    email: model.email || '',
    phone: model.phone || '',
    portfolio: portfolioArr,
    measurements: {
      ...(typeof model.measurements === 'object' ? model.measurements : {}),
      portfolio: portfolioArr,
      originalId: model.id,
      originalUserId: model.userId,
      heightOriginal: model.height,
      archived: Boolean(model.archived)
    },
    biography: model.biography || '',
    category: model.category || 'Fashion Models'
  });
}

async function mapModelToBaseSupabaseRow(model: Model): Promise<Record<string, any>> {
  const finalUuid = ensureUuidFormat(model.id);
  const validUserId = await getValidUserIdForModel(model.userId);
  return removeUndefined({
    id: finalUuid,
    userId: validUserId,
    name: model.name,
    gender: model.gender || 'female',
    age: Number(model.age) || 23,
    height: parseHeightToInteger(model.height),
    city: model.city || 'Mumbai',
    state: model.state || 'Maharashtra',
    starting_price: Number(model.startingPrice || (model as any).starting_price) || 15000,
    rating: Number(model.rating) || 5,
    reviews_count: Number(model.reviewsCount || (model as any).reviews_count) || 1,
    biography: model.biography || '',
    phone: model.phone || '',
    email: model.email || '',
    measurements: {
      ...(typeof model.measurements === 'object' ? model.measurements : {}),
      originalId: model.id,
      originalUserId: model.userId,
      heightOriginal: model.height,
      category: model.category,
      portfolio: model.portfolio,
      languages: model.languages,
      experience: model.experience,
      approved: model.approved !== undefined ? model.approved : true,
      rejected: model.rejected !== undefined ? model.rejected : false,
      selfieVerified: model.selfieVerified !== undefined ? model.selfieVerified : true
    }
  });
}
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
    let localModels: Model[] = SEED_MODELS;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = localStorage.getItem('mvi_models');
        if (local) localModels = JSON.parse(local);
      }
    } catch (e) {
      console.warn('LocalStorage read note:', e);
    }

    const mergedMap = new Map<string, Model>();
    // 1. Supabase Database Models (parsed)
    dbModels.filter(m => !isDummyModel(m)).forEach(m => mergedMap.set(m.id, m));
    // 2. LocalStorage Cached Models
    localModels.filter(m => !isDummyModel(m)).forEach(m => mergedMap.set(m.id, m));
    // 3. Express Server Backend Models (Highest Priority - Primary Source of Truth)
    backendModels.filter(m => !isDummyModel(m)).forEach(m => mergedMap.set(m.id, m));

    const finalModels = Array.from(mergedMap.values())
      .filter(m => !isDummyModel(m))
      .map(m => ({
        ...m,
        approved: m.approved !== undefined ? m.approved : true,
        category: m.category || 'Fashion Models',
        portfolio: extractPortfolioFromRow(m),
        startingPrice: m.startingPrice || 15000,
        available: m.available !== undefined ? m.available : (m.availabilityStatus === 'Available')
      }));

    return sanitizeValue(finalModels);
  },

  // ADD OR UPDATE MODEL (Resilient Dual-channel save)
  async saveModel(model: Model): Promise<Model> {
    let savedModel: Model = { ...model };

    // 1. Try Express backend FIRST if available
    try {
      const response = await fetch('/api/v2/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedModel)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.data) {
          savedModel = result.data;
        }
      }
    } catch (e) {
      console.warn('Express server model save note (proceeding with direct database save):', e);
    }

    // 2. Direct Supabase Database Write with fallback for schema differences
    if (isSupabaseAvailable && supabase) {
      try {
        const row = await mapModelToSupabaseRow(savedModel);
        if (row.userId) {
          await ensureUserExistsInDb(row.userId, savedModel.name, savedModel.email);
        }
        const { error } = await supabase
          .from('models')
          .upsert(row);
        if (error) {
          console.warn('Supabase models table full upsert note, trying base compatibility row:', error.message);
          const baseRow = await mapModelToBaseSupabaseRow(savedModel);
          const { error: baseErr } = await supabase.from('models').upsert(baseRow);
          if (baseErr) console.warn('Supabase base model upsert note:', baseErr.message);
          else console.log(`Successfully saved model "${savedModel.name}" (${savedModel.id}) via base compatibility row!`);
        } else {
          console.log(`Successfully saved model "${savedModel.name}" (${savedModel.id}) to Supabase models table!`);
        }
      } catch (e) {
        console.warn('Supabase saveModel error:', e);
      }
    }

    // 3. LocalStorage Cache (Resilient against QuotaExceededLimits)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const currentLocal = localStorage.getItem('mvi_models');
        let models: Model[] = currentLocal ? JSON.parse(currentLocal) : [];
        const idx = models.findIndex(m => m.id === savedModel.id);
        if (idx >= 0) {
          models[idx] = savedModel;
        } else {
          models.push(savedModel);
        }

        try {
          localStorage.setItem('mvi_models', JSON.stringify(models));
        } catch (quotaErr) {
          console.warn('LocalStorage quota reached, pruning older models safely:', quotaErr);
          // If storage quota exceeded, keep only the latest 3 models with full portfolio intact
          const prunedModels = models.slice(-3);
          try {
            localStorage.setItem('mvi_models', JSON.stringify(prunedModels));
          } catch (e) {
            console.warn('Could not cache full models array in localStorage, skipping cache.');
          }
        }
      }
    } catch (localErr) {
      console.error('Local storage saveModel failed:', localErr);
    }

    return savedModel;
  },

  // REGISTER MODEL VIA BACKEND ROUTE HANDLER AND DIRECT DATABASE WRITE
  async registerModel(model: Model): Promise<Model> {
    let savedModel: Model = { ...model };
    if (savedModel.approved === undefined) savedModel.approved = true;

    // Check if a model profile already exists for this User ID / Email
    const existing = await this.getModelByUserId(savedModel.userId, savedModel.email);
    if (existing) {
      savedModel.id = existing.id;
    }

    // 1. Try Express backend API FIRST if available
    try {
      const response = await fetch('/api/v2/models/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedModel)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.data) {
          savedModel = result.data;
        }
      }
    } catch (e) {
      console.warn('Express server model registration note (proceeding with direct database save):', e);
    }

    // 2. Direct Supabase Database Write with fallback for schema differences
    if (isSupabaseAvailable && supabase) {
      try {
        const row = await mapModelToSupabaseRow(savedModel);
        if (row.userId) {
          await ensureUserExistsInDb(row.userId, savedModel.name, savedModel.email);
        }
        const { error } = await supabase
          .from('models')
          .upsert(row);
        if (error) {
          console.warn('Supabase models table full registration note, trying base compatibility row:', error.message);
          const baseRow = await mapModelToBaseSupabaseRow(savedModel);
          const { error: baseErr } = await supabase.from('models').upsert(baseRow);
          if (baseErr) console.warn('Supabase base model registration note:', baseErr.message);
          else console.log(`Successfully registered model "${savedModel.name}" (${savedModel.id}) via base compatibility row!`);
        } else {
          console.log(`Successfully registered model "${savedModel.name}" (${savedModel.id}) in Supabase models table!`);
        }
      } catch (e) {
        console.warn('Supabase registerModel error:', e);
      }
    }

    // 3. LocalStorage Cache
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const currentLocal = localStorage.getItem('mvi_models');
        const models: Model[] = currentLocal ? JSON.parse(currentLocal) : [];
        const idx = models.findIndex(
          m => m.id === savedModel.id || (savedModel.userId && m.userId === savedModel.userId) || (savedModel.email && m.email && m.email.toLowerCase() === savedModel.email.toLowerCase())
        );
        if (idx >= 0) {
          savedModel.id = models[idx].id;
          models[idx] = { ...models[idx], ...savedModel };
        } else {
          models.push(savedModel);
        }
        try {
          localStorage.setItem('mvi_models', JSON.stringify(models));
        } catch (quotaErr) {
          console.warn('LocalStorage quota reached on registerModel, pruning older models safely:', quotaErr);
          const prunedModels = models.slice(-3);
          try {
            localStorage.setItem('mvi_models', JSON.stringify(prunedModels));
          } catch (e) {
            console.warn('Could not cache models array in localStorage, skipping cache.');
          }
        }
      }
    } catch (localErr) {
      console.error('Local storage registerModel failed:', localErr);
    }

    return savedModel;
  },

  // GET MODEL BY USER ID OR EMAIL (For 1 model profile per user enforcement)
  async getModelByUserId(userId: string, email?: string): Promise<Model | null> {
    if (!userId && !email) return null;
    const all = await this.getModels();
    const found = all.find(m => 
      (userId && m.userId === userId) || 
      (email && m.email && m.email.toLowerCase() === email.toLowerCase())
    );
    return found || null;
  }
};
