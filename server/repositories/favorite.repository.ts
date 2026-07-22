/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface FavoriteItem {
  id: string;
  clientId: string;
  modelId: string;
  createdAt?: string;
}

const LOCAL_FAVORITES_FILE = path.join(process.cwd(), 'local_favorites.json');

function getLocalFavorites(): FavoriteItem[] {
  try {
    if (fs.existsSync(LOCAL_FAVORITES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_FAVORITES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local favorites file:', e);
  }
  return [];
}

function saveLocalFavorites(favorites: FavoriteItem[]) {
  try {
    fs.writeFileSync(LOCAL_FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local favorites file:', e);
  }
}

export class FavoriteRepository {
  async findAll(): Promise<FavoriteItem[]> {
    let dbFavorites: FavoriteItem[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('favorites').select('*'),
          2500
        );
        if (!error && data) {
          dbFavorites = data.map((d: any) => ({
            id: d.id,
            clientId: d.client_id,
            modelId: d.model_id,
            createdAt: d.created_at,
          })) as FavoriteItem[];
        }
      } catch (e) {
        console.error('Supabase favorites query failed, using local fallback:', e);
      }
    }

    const localFavorites = getLocalFavorites();
    const mergedMap = new Map<string, FavoriteItem>();
    localFavorites.forEach((f) => mergedMap.set(f.id, f));
    dbFavorites.forEach((f) => mergedMap.set(f.id, f));

    return Array.from(mergedMap.values());
  }

  async findByClientId(clientId: string): Promise<FavoriteItem[]> {
    const all = await this.findAll();
    return all.filter((f) => f.clientId === clientId);
  }

  async findById(id: string): Promise<FavoriteItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('favorites').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return {
            id: data.id,
            clientId: data.client_id,
            modelId: data.model_id,
            createdAt: data.created_at,
          } as FavoriteItem;
        }
      } catch (e) {
        console.error(`Supabase query for favorite ${id} failed:`, e);
      }
    }

    const localFavorites = getLocalFavorites();
    return localFavorites.find((f) => f.id === id) || null;
  }

  async save(favorite: FavoriteItem): Promise<FavoriteItem> {
    const localFavorites = getLocalFavorites();
    const idx = localFavorites.findIndex((f) => f.id === favorite.id);
    if (idx >= 0) {
      localFavorites[idx] = favorite;
    } else {
      localFavorites.push(favorite);
    }
    saveLocalFavorites(localFavorites);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload = {
          id: favorite.id,
          client_id: favorite.clientId,
          model_id: favorite.modelId,
        };
        const { error } = await withTimeout(
          supabaseAdmin.from('favorites').upsert(payload),
          2500
        );
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase upsert failed for favorite ${favorite.id}:`, e.message || e);
      }
    }

    return favorite;
  }

  async delete(id: string): Promise<boolean> {
    const localFavorites = getLocalFavorites();
    const filtered = localFavorites.filter((f) => f.id !== id);
    if (filtered.length !== localFavorites.length) {
      saveLocalFavorites(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('favorites').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for favorite ${id}:`, e);
      }
    }

    return filtered.length !== localFavorites.length;
  }
}
