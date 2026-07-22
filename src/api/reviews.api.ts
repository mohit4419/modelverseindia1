/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Review } from '../types';

export const reviewsApi = {
  async getReviewsForModel(modelId: string): Promise<Review[]> {
    const response = await fetch(`/api/v2/reviews/${modelId}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch reviews');
    }
    return result.data;
  },

  async createReview(review: Review): Promise<Review> {
    const response = await fetch('/api/v2/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create review');
    }
    return result.data;
  }
};
