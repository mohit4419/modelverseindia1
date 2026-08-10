/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { Model } from '../types';

const LOCAL_MODELS_FILE = path.join(process.cwd(), 'local_models.json');

const INITIAL_SERVER_MODELS: Model[] = [];

function getLocalModels(): Model[] {
  try {
    if (fs.existsSync(LOCAL_MODELS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_MODELS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local models file:', e);
  }
  return [];
}

function saveLocalModels(models: Model[]) {
  try {
    fs.writeFileSync(LOCAL_MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local models file:', e);
  }
}

function toSupabaseModelRow(model: Model): Record<string, any> {
  const finalId = model.id || ('m_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const finalUserId = model.userId || ('u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

  const row: Record<string, any> = {
    id: finalId,
    userId: finalUserId,
  };

  row.name = model.name || 'Anonymous Model';
  row.gender = model.gender || 'female';
  row.age = typeof model.age === 'number' ? model.age : (parseInt(String(model.age), 10) || 24);

  if (typeof model.height === 'number') {
    row.height = model.height;
  } else if (typeof model.height === 'string') {
    const num = parseInt(model.height.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num >= 50 && num <= 300) {
      row.height = num;
    }
  }

  row.city = model.city || 'Mumbai';
  row.state = model.state || 'Maharashtra';
  row.category = model.category || 'Fashion Models';
  row.starting_price = typeof model.startingPrice === 'number' ? model.startingPrice : (parseFloat(String(model.startingPrice)) || 15000);
  row.rating = model.rating || 5.0;
  row.reviews_count = model.reviewsCount || 0;
  row.biography = model.biography || '';
  row.phone = model.phone || '';
  row.email = model.email || undefined;
  row.languages = Array.isArray(model.languages) ? model.languages : [];
  row.experience = model.experience || '';
  row.portfolio = Array.isArray(model.portfolio) ? model.portfolio : [];

  // Store rich metadata in measurements JSONB
  row.measurements = {
    ...(model.measurements || {}),
    category: model.category,
    portfolio: model.portfolio,
    portfolioCaptions: Array.isArray(model.portfolioCaptions) ? model.portfolioCaptions : [],
    portfolioCategories: Array.isArray(model.portfolioCategories) ? model.portfolioCategories : [],
    videoUrl: model.videoUrl,
    availabilityStatus: model.availabilityStatus,
    agencyInfo: model.agencyInfo,
    additionalDetails: model.additionalDetails,
    socialLinks: model.socialLinks,
    selfieUrl: model.selfieUrl,
    selfieVerified: model.selfieVerified,
    approved: model.approved,
    rejected: model.rejected,
    govIdUrl: model.govIdUrl,
    pdfUrl: model.pdfUrl,
    pdfName: model.pdfName,
    heightOriginal: model.height,
    originalId: model.id,
    originalUserId: model.userId,
    archived: Boolean(model.archived)
  };

  return row;
}

function fromSupabaseModelRow(row: any): Model {
  const extra = row.measurements || {};
  let portfolioList: string[] = [];

  if (Array.isArray(row.portfolio) && row.portfolio.length > 0) {
    portfolioList = row.portfolio.filter(Boolean);
  } else if (Array.isArray(extra.portfolio) && extra.portfolio.length > 0) {
    portfolioList = extra.portfolio.filter(Boolean);
  } else if (typeof row.portfolio === 'string' && row.portfolio) {
    portfolioList = [row.portfolio];
  } else if (typeof extra.portfolio === 'string' && extra.portfolio) {
    portfolioList = [extra.portfolio];
  }

  return {
    id: extra.originalId || row.id,
    userId: extra.originalUserId || row.userId || row.user_id || row.userid,
    name: row.name,
    gender: row.gender || 'female',
    age: row.age || 24,
    height: extra.heightOriginal || (row.height ? `${row.height} cm` : "5'9\""),
    city: row.city || 'Mumbai',
    state: row.state || 'Maharashtra',
    languages: Array.isArray(row.languages) ? row.languages : ['English', 'Hindi'],
    experience: row.experience || '2-5 years',
    category: extra.category || row.category || 'Fashion Models',
    portfolio: portfolioList,
    portfolioCaptions: Array.isArray(row.portfolioCaptions) ? row.portfolioCaptions : extra.portfolioCaptions,
    portfolioCategories: Array.isArray(row.portfolioCategories) ? row.portfolioCategories : extra.portfolioCategories,
    videoUrl: row.videoUrl || row.video_url,
    availabilityStatus: row.availabilityStatus || row.availability_status || 'Available',
    selfieVerified: extra.selfieVerified !== undefined ? extra.selfieVerified : true,
    selfieUrl: extra.selfieUrl || row.selfieUrl,
    approved: extra.approved !== undefined ? extra.approved : true,
    rejected: extra.rejected !== undefined ? extra.rejected : false,
    archived: extra.archived !== undefined ? Boolean(extra.archived) : Boolean(row.archived),
    startingPrice: row.starting_price || row.startingPrice || 15000,
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewsCount: row.reviews_count !== undefined ? Number(row.reviews_count) : 0,
    biography: row.biography || '',
    phone: row.phone,
    email: row.email,
    govIdUrl: extra.govIdUrl,
    pdfUrl: extra.pdfUrl,
    pdfName: extra.pdfName,
    socialLinks: extra.socialLinks,
    measurements: extra,
    agencyInfo: extra.agencyInfo,
    additionalDetails: extra.additionalDetails
  };
}

export class ModelRepository {
  async findAll(): Promise<Model[]> {
    let dbModels: Model[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('models').select('*'),
          2500
        );
        if (!error && Array.isArray(data)) {
          dbModels = data.map(fromSupabaseModelRow);
        }
      } catch (e) {
        console.error('Supabase model query failed, falling back to local:', e);
      }
    }

    const mergedMap = new Map<string, Model>();

    if (dbModels.length > 0) {
      // Primary Source of Truth: Database models from Supabase
      // Deduplicate by userId (or id), keeping the latest updated profile with photos
      dbModels.forEach((m) => {
        const key = m.userId || m.id;
        const existing = mergedMap.get(key);
        if (!existing) {
          mergedMap.set(key, m);
        } else {
          const existingPhotos = Array.isArray(existing.portfolio) ? existing.portfolio.length : 0;
          const newPhotos = Array.isArray(m.portfolio) ? m.portfolio.length : 0;
          const existingTime = new Date((existing as any).updated_at || existing.createdAt || 0).getTime();
          const newTime = new Date((m as any).updated_at || m.createdAt || 0).getTime();

          if (newTime >= existingTime || (newPhotos >= existingPhotos && newPhotos > 0)) {
            mergedMap.set(key, m);
          }
        }
      });
      return Array.from(mergedMap.values());
    }

    // Fallback ONLY when database has 0 models
    const localModels = getLocalModels();
    INITIAL_SERVER_MODELS.forEach((m) => mergedMap.set(m.userId || m.id, m));
    localModels.forEach((m) => mergedMap.set(m.userId || m.id, m));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Model | null> {
    const localModels = getLocalModels();
    const localMatch = localModels.find((m) => m.id === id);
    if (localMatch) return localMatch;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('models').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return fromSupabaseModelRow(data);
        }
      } catch (e) {
        console.error(`Supabase query for model ${id} failed:`, e);
      }
    }

    return INITIAL_SERVER_MODELS.find((m) => m.id === id) || null;
  }

  async findByUserId(userId: string, email?: string): Promise<Model | null> {
    if (!userId && !email) return null;
    const all = await this.findAll();
    const match = all.find((m) =>
      (userId && String(m.userId) === String(userId)) ||
      (email && m.email && m.email.toLowerCase() === email.toLowerCase())
    );
    return match || null;
  }

  async save(model: Model): Promise<Model> {
    // Check if model already exists by id, userId, or email to prevent duplicate model creation
    const localModels = getLocalModels();
    const existingIdx = localModels.findIndex(
      (m) =>
        m.id === model.id ||
        (model.userId && String(m.userId) === String(model.userId)) ||
        (model.email && m.email && m.email.toLowerCase() === model.email.toLowerCase())
    );

    if (existingIdx >= 0) {
      // Reuse existing model ID to update existing profile instead of duplicating
      const existing = localModels[existingIdx];
      model.id = existing.id;
      localModels[existingIdx] = { ...existing, ...model, id: existing.id };
    } else {
      localModels.push(model);
    }
    saveLocalModels(localModels);

    // Save to Supabase
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = toSupabaseModelRow(model);
        if (row.userId) {
          try {
            await withTimeout(
              supabaseAdmin.from('users').upsert({
                id: row.userId,
                email: (model.email || `${row.userId}@modelverse.in`).toLowerCase(),
                phone_number: model.phone || null,
                created_at: new Date().toISOString()
              }),
              2000
            );
          } catch (uErr) {
            // Ignore if users table schema varies
          }
        }
        let { error } = await withTimeout(
          supabaseAdmin.from('models').upsert(row),
          2500
        );
        if (error && (error.message?.includes('user_id') || error.message?.includes('userId') || error.message?.includes('schema cache'))) {
          const altRow = { ...row, user_id: row.userId || row.user_id };
          delete altRow.userId;
          const { error: altErr } = await withTimeout(
            supabaseAdmin.from('models').upsert(altRow),
            2500
          );
          if (!altErr) error = null;
        }
        if (error) {
          console.warn(`Supabase upsert warning for model ${model.id}:`, error.message || error);
        } else {
          console.log(`Model ${model.id} successfully saved to Supabase.`);
        }
      } catch (e: any) {
        console.warn(`Supabase upsert failed for model ${model.id}:`, e.message || e);
      }
    }

    return model;
  }

  // Delete method removed — models cannot be deleted, only edited
}
