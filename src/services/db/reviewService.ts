/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Review } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureUserExistsInDb, ensureModelExistsInDb } from './helpers';
import { SEED_REVIEWS, SEED_USERS, SEED_MODELS } from './seedData';
import { modelService } from './modelService';

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export const reviewService = {
  async getReviews(modelId: string): Promise<Review[]> {
    let dbReviews: Review[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, users(full_name, avatar)')
          .eq('model_id', modelId);
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
        console.error('Supabase review query failed', e);
      }
    }
    const local = localStorage.getItem('mvi_reviews');
    const localReviews: Review[] = local ? JSON.parse(local) : SEED_REVIEWS;

    const mergedMap = new Map<string, Review>();
    SEED_REVIEWS.forEach(r => mergedMap.set(r.id, r));
    localReviews.forEach(r => mergedMap.set(r.id, r));
    dbReviews.forEach(r => mergedMap.set(r.id, r));

    const all = Array.from(mergedMap.values());
    return all.filter(r => r.modelId === modelId);
  },

  async addReview(review: Review): Promise<void> {
    try {
      const local = localStorage.getItem('mvi_reviews');
      const reviews: Review[] = local ? JSON.parse(local) : SEED_REVIEWS;
      reviews.push(review);
      localStorage.setItem('mvi_reviews', JSON.stringify(reviews));

      const models = await modelService.getModels();
      const mIdx = models.findIndex(m => m.id === review.modelId);
      if (mIdx >= 0) {
        const currentModelReviews = reviews.filter(r => r.modelId === review.modelId);
        const totalRating = currentModelReviews.reduce((sum, r) => sum + r.rating, 0);
        models[mIdx].rating = Number((totalRating / currentModelReviews.length).toFixed(1));
        models[mIdx].reviewsCount = currentModelReviews.length;
        await modelService.saveModel(models[mIdx]);
      }
    } catch (localErr) {
      console.error('Local storage addReview failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await ensureUserExistsInDb(review.clientId, review.clientName, undefined, SEED_USERS);
        await ensureModelExistsInDb(review.modelId, SEED_MODELS);

        const dbId = isValidUUID(review.id) ? review.id : undefined;
        const dbClientId = isValidUUID(review.clientId) ? review.clientId : null;
        const dbModelId = isValidUUID(review.modelId) ? review.modelId : null;

        const dbPayload: any = {
          rating: review.rating,
          review: review.review,
        };

        if (dbId) dbPayload.id = dbId;
        if (dbClientId) dbPayload.client_id = dbClientId;
        if (dbModelId) dbPayload.model_id = dbModelId;

        const { error } = await supabase
          .from('reviews')
          .insert(dbPayload);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase review save failed (falling back to local):', e);
      }
    }
  }
};
