/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface PortfolioItem {
  id: string;
  modelId: string;
  imageUrl: string;
  caption?: string;
  category?: string;
  sortOrder?: number;
  type?: string;
  createdAt?: string;
}

const LOCAL_PORTFOLIOS_FILE = path.join(process.cwd(), 'local_portfolios.json');

function getLocalPortfolios(): PortfolioItem[] {
  try {
    if (fs.existsSync(LOCAL_PORTFOLIOS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_PORTFOLIOS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local portfolios file:', e);
  }
  return [];
}

function saveLocalPortfolios(portfolios: PortfolioItem[]) {
  try {
    fs.writeFileSync(LOCAL_PORTFOLIOS_FILE, JSON.stringify(portfolios, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local portfolios file:', e);
  }
}

export class PortfolioRepository {
  async findAll(): Promise<PortfolioItem[]> {
    let dbPortfolios: PortfolioItem[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('portfolio_images').select('*'),
          2500
        );
        if (!error && data) {
          dbPortfolios = data.map((d: any) => ({
            id: d.id,
            modelId: d.model_id,
            imageUrl: d.image_url,
            caption: d.caption,
            category: d.category,
            sortOrder: d.sort_order,
          })) as PortfolioItem[];
        }
      } catch (e) {
        console.error('Supabase portfolio query failed, using local fallback:', e);
      }
    }

    const localPortfolios = getLocalPortfolios();
    const mergedMap = new Map<string, PortfolioItem>();
    localPortfolios.forEach((p) => mergedMap.set(p.id, p));
    dbPortfolios.forEach((p) => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  }

  async findByModelId(modelId: string): Promise<PortfolioItem[]> {
    const all = await this.findAll();
    return all.filter((p) => p.modelId === modelId);
  }

  async findById(id: string): Promise<PortfolioItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('portfolio_images').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return {
            id: data.id,
            modelId: data.model_id,
            imageUrl: data.image_url,
            caption: data.caption,
            category: data.category,
            sortOrder: data.sort_order,
          } as PortfolioItem;
        }
      } catch (e) {
        console.error(`Supabase query for portfolio ${id} failed:`, e);
      }
    }

    const localPortfolios = getLocalPortfolios();
    return localPortfolios.find((p) => p.id === id) || null;
  }

  async save(item: PortfolioItem): Promise<PortfolioItem> {
    const localPortfolios = getLocalPortfolios();
    const idx = localPortfolios.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      localPortfolios[idx] = item;
    } else {
      localPortfolios.push(item);
    }
    saveLocalPortfolios(localPortfolios);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload = {
          id: item.id,
          model_id: item.modelId,
          image_url: item.imageUrl,
          caption: item.caption,
          category: item.category,
          sort_order: item.sortOrder || 0,
        };
        const { error } = await withTimeout(
          supabaseAdmin.from('portfolio_images').upsert(payload),
          2500
        );
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase upsert failed for portfolio ${item.id}:`, e.message || e);
      }
    }

    return item;
  }

  async delete(id: string): Promise<boolean> {
    const localPortfolios = getLocalPortfolios();
    const filtered = localPortfolios.filter((p) => p.id !== id);
    if (filtered.length !== localPortfolios.length) {
      saveLocalPortfolios(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('portfolio_images').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for portfolio ${id}:`, e);
      }
    }

    return filtered.length !== localPortfolios.length;
  }
}
