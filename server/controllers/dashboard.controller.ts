/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AnalyticsService } from '../services/analytics.service';

const dashboardService = new DashboardService();
const analyticsService = new AnalyticsService();

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRecentBookings(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return res.status(200).json({ success: true, data: stats.recentBookings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getEarnings(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: {
          totalRevenue: stats.totalRevenue,
          recentPayments: stats.recentPayments
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const analytics = await analyticsService.getRevenueAnalytics((period as string) || 'monthly');
      return res.status(200).json({ success: true, data: analytics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSignupAnalytics(req: Request, res: Response) {
    try {
      const signups = await analyticsService.getSignupAnalytics();
      return res.status(200).json({ success: true, data: signups });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
