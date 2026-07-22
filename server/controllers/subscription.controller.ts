/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const LOCAL_PROFILES_FILE = path.join(process.cwd(), 'local_profiles.json');

const SUBSCRIPTION_PLANS = [
  { id: 'agency-starter', name: 'Agency Starter', price: 1999, billing: 'monthly', features: ['Up to 5 model profiles', 'Secure chat access', 'Basic analytics'] },
  { id: 'agency-pro', name: 'Agency Pro', price: 4999, billing: 'monthly', features: ['Unlimited models', 'Priority matching', 'Secure Escrow payment integrations', 'Strategic negotiation coaching'] },
  { id: 'model-pro', name: 'Model Premium', price: 499, billing: 'monthly', features: ['Featured badge', 'Unlimited media files', 'Audition invites', 'Analytics insights'] }
];

export class SubscriptionController {
  static async getPlans(req: Request, res: Response) {
    return res.status(200).json({ success: true, data: SUBSCRIPTION_PLANS });
  }

  static async getStatus(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId || 'anonymous_user';
      let activeSubscription = {
        userId,
        planId: 'free',
        planName: 'Free tier',
        status: 'active',
        expiresAt: null
      };

      if (fs.existsSync(LOCAL_PROFILES_FILE)) {
        const profiles = JSON.parse(fs.readFileSync(LOCAL_PROFILES_FILE, 'utf8'));
        const prof = profiles.find((p: any) => p.id === userId);
        if (prof && prof.subscription) {
          activeSubscription = prof.subscription;
        }
      }

      return res.status(200).json({ success: true, data: activeSubscription });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async subscribe(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { planId } = req.body;
      if (!userId || !planId) {
        return res.status(400).json({ success: false, error: 'userId and planId are required.' });
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        return res.status(400).json({ success: false, error: 'Invalid planId' });
      }

      const subscription = {
        userId,
        planId,
        planName: plan.name,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      if (fs.existsSync(LOCAL_PROFILES_FILE)) {
        const profiles = JSON.parse(fs.readFileSync(LOCAL_PROFILES_FILE, 'utf8'));
        const idx = profiles.findIndex((p: any) => p.id === userId);
        if (idx >= 0) {
          profiles[idx].subscription = subscription;
          profiles[idx].isPremium = true;
          fs.writeFileSync(LOCAL_PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
        }
      }

      return res.status(200).json({ success: true, message: 'Subscribed successfully.', data: subscription });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async cancel(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required.' });
      }

      if (fs.existsSync(LOCAL_PROFILES_FILE)) {
        const profiles = JSON.parse(fs.readFileSync(LOCAL_PROFILES_FILE, 'utf8'));
        const idx = profiles.findIndex((p: any) => p.id === userId);
        if (idx >= 0 && profiles[idx].subscription) {
          profiles[idx].subscription.status = 'cancelled';
          fs.writeFileSync(LOCAL_PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
        }
      }

      return res.status(200).json({ success: true, message: 'Subscription cancelled successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
