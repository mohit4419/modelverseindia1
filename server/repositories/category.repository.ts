/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

const LOCAL_CATEGORIES_FILE = path.join(process.cwd(), 'local_categories.json');

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_runway', name: 'High Fashion / Runway', description: 'Runway modeling and designer showcase' },
  { id: 'cat_commercial', name: 'Commercial / Print', description: 'Advertisements, catalogs, and print media' },
  { id: 'cat_fitness', name: 'Fitness / Athletic', description: 'Sports, gym, and active wear campaigns' },
  { id: 'cat_editorial', name: 'Editorial / Couture', description: 'Artistic modeling for high-end magazines' },
  { id: 'cat_parts', name: 'Parts Modeling', description: 'Hands, feet, hair, or eye specialty modeling' },
];

function getLocalCategories(): Category[] {
  try {
    if (fs.existsSync(LOCAL_CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_CATEGORIES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local categories file:', e);
  }
  return DEFAULT_CATEGORIES;
}

function saveLocalCategories(categories: Category[]) {
  try {
    fs.writeFileSync(LOCAL_CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local categories file:', e);
  }
}

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    let dbCategories: Category[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('categories').select('*'),
          2500
        );
        if (!error && data) {
          dbCategories = data as Category[];
        }
      } catch (e) {
        console.error('Supabase categories query failed, using local fallback:', e);
      }
    }

    const localCategories = getLocalCategories();
    const mergedMap = new Map<string, Category>();
    localCategories.forEach((c) => mergedMap.set(c.id, c));
    dbCategories.forEach((c) => mergedMap.set(c.id, c));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Category | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('categories').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return data as Category;
        }
      } catch (e) {
        console.error(`Supabase query for category ${id} failed:`, e);
      }
    }

    const localCategories = getLocalCategories();
    return localCategories.find((c) => c.id === id) || null;
  }

  async save(category: Category): Promise<Category> {
    const localCategories = getLocalCategories();
    const idx = localCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      localCategories[idx] = category;
    } else {
      localCategories.push(category);
    }
    saveLocalCategories(localCategories);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('categories').upsert(category),
          2500
        );
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase upsert failed for category ${category.id}:`, e.message || e);
      }
    }

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const localCategories = getLocalCategories();
    const filtered = localCategories.filter((c) => c.id !== id);
    if (filtered.length !== localCategories.length) {
      saveLocalCategories(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('categories').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for category ${id}:`, e);
      }
    }

    return filtered.length !== localCategories.length;
  }
}
