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
      portfolioCaptions: Array.isArray(model.portfolioCaptions) ? model.portfolioCaptions : [],
      portfolioCategories: Array.isArray(model.portfolioCategories) ? model.portfolioCategories : [],
      videoUrl: model.videoUrl,
      availabilityStatus: model.availabilityStatus,
      originalId: model.id,
      originalUserId: model.userId,
      heightOriginal: model.height,
      archived: Boolean(model.archived)
    },
    biography: model.biography || '',
    category: model.category || 'Fashion Models',
    updated_at: new Date().toISOString()
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
    category: model.category || 'Fashion Models',
    portfolio: Array.isArray(model.portfolio) ? model.portfolio.filter(Boolean) : [],
    updated_at: new Date().toISOString()
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

  async getModelByUserId(userId: string, email?: string): Promise<Model | null> {
    const models = await this.getModels();
    const match = models.find(m => 
      (userId && m.userId === userId) ||
      (email && m.email && m.email.toLowerCase() === email.toLowerCase())
    );
    return match || null;
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
        const { data, error } = await supabase.from('models').select('*').order('created_at', { ascending: false });
        if (!error && data && Array.isArray(data)) {
          dbModels = data.map(fromSupabaseModelRow);
        }
      } catch (e) {
        console.error('Supabase models fetch failed, using fallback', e);
      }
    }

    // Determine primary database models
    const databaseModels = backendModels.length > 0 ? backendModels : dbModels;
    const mergedMap = new Map<string, Model>();

    if (databaseModels.length > 0) {
      // Real database models exist in public.models: Strictly fetch database records without dropping distinct models
      databaseModels.filter(m => !isDummyModel(m)).forEach(m => {
        const modelKey = m.id || m.userId;
        const existing = mergedMap.get(modelKey);
        if (!existing) {
          mergedMap.set(modelKey, m);
        } else {
          const existingPhotos = Array.isArray(existing.portfolio) ? existing.portfolio.length : 0;
          const newPhotos = Array.isArray(m.portfolio) ? m.portfolio.length : 0;
          const existingTime = new Date((existing as any).updated_at || (existing as any).createdAt || 0).getTime();
          const newTime = new Date((m as any).updated_at || (m as any).createdAt || 0).getTime();

          if (newTime >= existingTime || (newPhotos >= existingPhotos && newPhotos > 0)) {
            mergedMap.set(modelKey, m);
          }
        }
      });
    } else {
      // Fallback ONLY when database returns 0 models (offline or uninitialized DB)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const local = localStorage.getItem('mvi_models');
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.filter(m => !isDummyModel(m)).forEach(m => {
                const userKey = m.userId || m.id;
                mergedMap.set(userKey, m);
              });
            }
          }
        }
      } catch (e) {
        console.warn('LocalStorage read note:', e);
      }

      if (mergedMap.size === 0) {
        SEED_MODELS.filter(m => !isDummyModel(m)).forEach(m => {
          const userKey = m.userId || m.id;
          mergedMap.set(userKey, m);
        });
      }
    }

    const finalModels = Array.from(mergedMap.values())
      .filter(m => !isDummyModel(m))
      .map(m => ({
        ...m,
        approved: m.approved !== undefined ? m.approved : true,
        category: m.category || 'Fashion Models',
        portfolio: extractPortfolioFromRow(m),
        startingPrice: m.startingPrice || 15000,
        archived: Boolean(m.archived),
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
        if (row.userId || row.user_id) {
          await ensureUserExistsInDb(row.userId || row.user_id, savedModel.name, savedModel.email);
        }
        let { error } = await supabase.from('models').upsert(row);
        if (error && (error.message?.includes('user_id') || error.message?.includes('userId') || error.message?.includes('schema cache'))) {
          const altRow = { ...row, user_id: row.userId || row.user_id };
          delete altRow.userId;
          const { error: altErr } = await supabase.from('models').upsert(altRow);
          if (!altErr) error = null;
        }
        if (error) {
          console.warn('Supabase models table full upsert note, trying base compatibility row:', error.message);
          const baseRow = await mapModelToBaseSupabaseRow(savedModel);
          let { error: baseErr } = await supabase.from('models').upsert(baseRow);
          if (baseErr && (baseErr.message?.includes('user_id') || baseErr.message?.includes('userId') || baseErr.message?.includes('schema cache'))) {
            const altBaseRow = { ...baseRow, user_id: baseRow.userId || baseRow.user_id };
            delete altBaseRow.userId;
            const { error: altBaseErr } = await supabase.from('models').upsert(altBaseRow);
            if (!altBaseErr) baseErr = null;
          }
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

    let apiSaved = false;
    let apiErrorMsg = '';

    // 1. Try Express backend API FIRST if available
    try {
      const response = await fetch('/api/v2/models/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedModel)
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result && result.success) {
        if (result.data) {
          savedModel = result.data;
        }
        apiSaved = true;
      } else {
        apiErrorMsg = result?.error || `HTTP ${response.status}`;
      }
    } catch (e: any) {
      console.warn('Express server model registration note:', e);
      apiErrorMsg = e?.message || 'Network error';
    }

    let supabaseSaved = false;
    // 2. Direct Supabase Database Write with fallback for schema differences
    if (isSupabaseAvailable && supabase) {
      try {
        const row = await mapModelToSupabaseRow(savedModel);
        if (row.userId || row.user_id) {
          await ensureUserExistsInDb(row.userId || row.user_id, savedModel.name, savedModel.email);
        }
        let { error } = await supabase.from('models').upsert(row);
        if (error && (error.message?.includes('user_id') || error.message?.includes('userId') || error.message?.includes('schema cache'))) {
          const altRow = { ...row, user_id: row.userId || row.user_id };
          delete altRow.userId;
          const { error: altErr } = await supabase.from('models').upsert(altRow);
          if (!altErr) error = null;
        }
        if (error) {
          console.warn('Supabase models table full registration note, trying base compatibility row:', error.message);
          const baseRow = await mapModelToBaseSupabaseRow(savedModel);
          let { error: baseErr } = await supabase.from('models').upsert(baseRow);
          if (baseErr && (baseErr.message?.includes('user_id') || baseErr.message?.includes('userId') || baseErr.message?.includes('schema cache'))) {
            const altBaseRow = { ...baseRow, user_id: baseRow.userId || baseRow.user_id };
            delete altBaseRow.userId;
            const { error: altBaseErr } = await supabase.from('models').upsert(altBaseRow);
            if (!altBaseErr) baseErr = null;
          }
          if (baseErr) {
            console.warn('Supabase base model registration note:', baseErr.message);
          } else {
            supabaseSaved = true;
            console.log(`Successfully registered model "${savedModel.name}" (${savedModel.id}) via base compatibility row!`);
          }
        } else {
          supabaseSaved = true;
          console.log(`Successfully registered model "${savedModel.name}" (${savedModel.id}) in Supabase models table!`);
        }
      } catch (e) {
        console.warn('Supabase registerModel error:', e);
      }
    }

    if (!apiSaved && !supabaseSaved && isSupabaseAvailable) {
      throw new Error(`Failed to save model profile to database: ${apiErrorMsg || 'Database error'}`);
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

  async deleteModel(modelId: string): Promise<void> {
    // 1. Delete from LocalStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = localStorage.getItem('mvi_models');
        if (local) {
          const models: Model[] = JSON.parse(local);
          const filtered = models.filter(
            m => m.id !== modelId && m.userId !== modelId
          );
          localStorage.setItem('mvi_models', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('LocalStorage deleteModel error:', e);
    }

    // 2. Delete from Supabase Database
    if (isSupabaseAvailable && supabase) {
      try {
        if (isUUID(modelId)) {
          await supabase.from('models').delete().eq('id', modelId);
        }
        await supabase.from('models').delete().eq('userId', modelId);
        await supabase.from('models').delete().eq('user_id', modelId);
      } catch (e) {
        console.warn('Supabase deleteModel error:', e);
      }
    }

    // 3. Delete from backend API if endpoint exists
    try {
      await fetch(`/api/v2/models/${modelId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend API model delete note:', e);
    }
  }
};
