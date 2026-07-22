import { useState, useEffect } from 'react';
import { reviewsApi } from '../api/reviews.api';

export function useReviews(modelId?: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!modelId) return;
    async function load() {
      setLoading(true);
      try {
        const data = await reviewsApi.getReviewsForModel(modelId);
        setReviews(data);
      } catch (e) {
        console.error('Failed to load reviews', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [modelId]);

  const addReview = async (review: any) => {
    const newRev = await reviewsApi.createReview(review);
    setReviews((prev) => [newRev, ...prev]);
  };

  return { reviews, loading, addReview };
}
