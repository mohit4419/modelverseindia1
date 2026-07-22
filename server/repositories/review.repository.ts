/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { Review } from '../types';

const LOCAL_REVIEWS_FILE = path.join(process.cwd(), 'local_reviews.json');

function getLocalReviews(): Review[] {
  try {
    if (fs.existsSync(LOCAL_REVIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_REVIEWS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local reviews file:', e);
  }
  return [];
}

function saveLocalReviews(reviews: Review[]) {
  try {
    fs.writeFileSync(LOCAL_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local reviews file:', e);
  }
}

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export class ReviewRepository {
  async findAll(): Promise<Review[]> {
    let dbReviews: Review[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('reviews').select('*, users(full_name, avatar)'),
          2500
        );
        if (!error && data) {
          dbReviews = data.map((r: any) => {
            const u = r.users || {};
            return {
              id: r.id,
              clientId: r.client_id || r.clientId,
              clientName: u.full_name || r.clientName || 'Client',
              clientAvatar: u.avatar || r.clientAvatar || undefined,
              modelId: r.model_id || r.modelId,
              rating: r.rating,
              review: r.review,
              date: r.created_at || r.date,
            };
          }) as Review[];
        }
      } catch (e) {
        console.error('Supabase reviews query failed:', e);
      }
    }

    const localReviews = getLocalReviews();
    const mergedMap = new Map<string, Review>();
    localReviews.forEach((r) => mergedMap.set(r.id, r));
    dbReviews.forEach((r) => mergedMap.set(r.id, r));

    return Array.from(mergedMap.values());
  }

  async findByModelId(modelId: string): Promise<Review[]> {
    const all = await this.findAll();
    return all.filter((r) => r.modelId === modelId);
  }

  async findById(id: string): Promise<Review | null> {
    const all = await this.findAll();
    return all.find((r) => r.id === id) || null;
  }

  async delete(id: string): Promise<boolean> {
    const localReviews = getLocalReviews();
    const filtered = localReviews.filter((r) => r.id !== id);
    if (filtered.length !== localReviews.length) {
      saveLocalReviews(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('reviews').delete().eq('id', id),
          2500
        );
        if (error) throw error;
        return true;
      } catch (e) {
        console.error(`Supabase delete failed for review ${id}:`, e);
      }
    }

    return filtered.length !== localReviews.length;
  }

  async save(review: Review): Promise<Review> {
    const localReviews = getLocalReviews();
    const idx = localReviews.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      localReviews[idx] = review;
    } else {
      localReviews.push(review);
    }
    saveLocalReviews(localReviews);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const dbId = isValidUUID(review.id) ? review.id : undefined;
        const dbClientId = isValidUUID(review.clientId) ? review.clientId : null;
        const dbModelId = isValidUUID(review.modelId) ? review.modelId : null;

        const insertPayload: any = {
          rating: review.rating,
          review: review.review,
        };

        if (dbId) insertPayload.id = dbId;
        if (dbClientId) insertPayload.client_id = dbClientId;
        if (dbModelId) insertPayload.model_id = dbModelId;

        const { error } = await withTimeout(
          supabaseAdmin.from('reviews').upsert(insertPayload),
          2500
        );
        if (error) throw error;
        console.log(`Review ${review.id} successfully saved to Supabase.`);
      } catch (e: any) {
        console.warn(`Supabase upsert failed for review ${review.id}:`, e.message || e);
      }
    }

    return review;
  }
}
