/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewRepository } from '../repositories/review.repository';
import { ModelRepository } from '../repositories/model.repository';
import { Review } from '../types';

export class ReviewService {
  private reviewRepository = new ReviewRepository();
  private modelRepository = new ModelRepository();

  async getReviewsForModel(modelId: string): Promise<Review[]> {
    return this.reviewRepository.findByModelId(modelId);
  }

  private async recalculateModelRating(modelId: string): Promise<void> {
    try {
      const model = await this.modelRepository.findById(modelId);
      if (model) {
        const reviews = await this.reviewRepository.findByModelId(modelId);
        const count = reviews.length;
        const avgRating = count > 0 
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
          : 5.0;

        await this.modelRepository.save({
          ...model,
          rating: avgRating,
          reviewsCount: count,
        });
      }
    } catch (e) {
      console.error('Error auto-updating model review aggregates:', e);
    }
  }

  async createReview(reviewData: Review): Promise<Review> {
    const saved = await this.reviewRepository.save(reviewData);
    await this.recalculateModelRating(reviewData.modelId);
    return saved;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const existing = await this.reviewRepository.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    const saved = await this.reviewRepository.save(updated);
    await this.recalculateModelRating(existing.modelId);
    return saved;
  }

  async deleteReview(id: string): Promise<boolean> {
    const existing = await this.reviewRepository.findById(id);
    if (!existing) return false;
    const success = await this.reviewRepository.delete(id);
    if (success) {
      await this.recalculateModelRating(existing.modelId);
    }
    return success;
  }
}
