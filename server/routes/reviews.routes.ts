/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { Review } from '../types';

const router = Router();
const reviewService = new ReviewService();

router.get('/reviews/:modelId', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    const reviews = await reviewService.getReviewsForModel(modelId);
    return res.status(200).json({ success: true, data: reviews });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const reviewData: Review = req.body;
    if (!reviewData || !reviewData.id || !reviewData.modelId) {
      return res.status(400).json({ success: false, error: 'Invalid review payload.' });
    }
    const saved = await reviewService.createReview(reviewData);
    return res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await reviewService.updateReview(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    return res.status(200).json({ success: true, data: updated, message: 'Review updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await reviewService.deleteReview(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    return res.status(200).json({ success: true, message: 'Review deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
