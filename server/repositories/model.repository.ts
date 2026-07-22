/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { Model } from '../types';

const LOCAL_MODELS_FILE = path.join(process.cwd(), 'local_models.json');

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

export class ModelRepository {
  async findAll(): Promise<Model[]> {
    let dbModels: Model[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('models').select('*'),
          2500
        );
        if (!error && data) {
          dbModels = data as Model[];
        }
      } catch (e) {
        console.error('Supabase model query failed, falling back to local:', e);
      }
    }

    const localModels = getLocalModels();
    const mergedMap = new Map<string, Model>();
    localModels.forEach((m) => mergedMap.set(m.id, m));
    dbModels.forEach((m) => mergedMap.set(m.id, m));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Model | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('models').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return data as Model;
        }
      } catch (e) {
        console.error(`Supabase query for model ${id} failed:`, e);
      }
    }

    const localModels = getLocalModels();
    return localModels.find((m) => m.id === id) || null;
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
        console.log("MODEL PAYLOAD");
console.log(JSON.stringify(model, null, 2));

  const cleanModel = JSON.parse(JSON.stringify(model));

  console.log('Model payload:', cleanModel);

  const { data, error } = await withTimeout(
    supabaseAdmin
      .from('models')
      .upsert(cleanModel)
      .select(),
    2500
  );

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  console.log('Supabase response:', data);
  console.log(`Model ${model.id} successfully saved to Supabase.`);
} catch (e: any) {
  console.error('Supabase upsert failed:', e);
  throw e;
}
    }

    return model;
  }

  async delete(id: string): Promise<boolean> {
    const localModels = getLocalModels();
    const filtered = localModels.filter((m) => m.id !== id);
    if (filtered.length !== localModels.length) {
      saveLocalModels(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('models').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for model ${id}:`, e);
      }
    }

    return filtered.length !== localModels.length;
  }
}
