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
  const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const row: Record<string, any> = {};

  if (isUuid(model.id)) {
    row.id = model.id;
  }
  if (isUuid(model.userId)) {
    row.userId = model.userId;
    row.user_id = model.userId;
    row.userid = model.userId;
  }

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
  row.starting_price = typeof model.startingPrice === 'number' ? model.startingPrice : (parseFloat(String(model.startingPrice)) || 15000);
  row.rating = model.rating || 5.0;
  row.reviews_count = model.reviewsCount || 0;
  row.biography = model.biography || '';
  row.phone = model.phone || '';
  row.email = model.email || undefined;
  row.languages = Array.isArray(model.languages) ? model.languages : [];
  row.experience = model.experience || '';
  row.videoUrl = model.videoUrl || undefined;
  row.availabilityStatus = model.availabilityStatus || 'Available';

  // Store rich metadata in measurements JSONB
  row.measurements = {
    ...(model.measurements || {}),
    category: model.category,
    portfolio: model.portfolio,
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
    originalUserId: model.userId
  };

  return row;
}

function fromSupabaseModelRow(row: any): Model {
  const extra = row.measurements || {};
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
    category: extra.category || 'Fashion Models',
    portfolio: Array.isArray(extra.portfolio) ? extra.portfolio : [],
    videoUrl: row.videoUrl || row.video_url,
    availabilityStatus: row.availabilityStatus || row.availability_status || 'Available',
    selfieVerified: extra.selfieVerified !== undefined ? extra.selfieVerified : true,
    selfieUrl: extra.selfieUrl,
    approved: extra.approved !== undefined ? extra.approved : true,
    rejected: extra.rejected !== undefined ? extra.rejected : false,
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

    const localModels = getLocalModels();
    const mergedMap = new Map<string, Model>();
    INITIAL_SERVER_MODELS.forEach((m) => mergedMap.set(m.id, m));
    dbModels.forEach((m) => mergedMap.set(m.id, m));
    localModels.forEach((m) => mergedMap.set(m.id, m)); // Local models registered by user take priority

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

  async save(model: Model): Promise<Model> {
    // Save locally
    const localModels = getLocalModels();
    const idx = localModels.findIndex((m) => m.id === model.id);
    if (idx >= 0) {
      localModels[idx] = model;
    } else {
      localModels.push(model);
    }
    saveLocalModels(localModels);

    // Save to Supabase
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = toSupabaseModelRow(model);
        const { error } = await withTimeout(
          supabaseAdmin.from('models').upsert(row),
          2500
        );
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
