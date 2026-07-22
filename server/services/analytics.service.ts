/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingRepository } from '../repositories/booking.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { UserRepository } from '../repositories/user.repository';

export class AnalyticsService {
  private bookingRepo = new BookingRepository();
  private paymentRepo = new PaymentRepository();
  private userRepo = new UserRepository();

  async getRevenueAnalytics(period: string = 'monthly') {
    const payments = await this.paymentRepo.findAll();
    const successfulPayments = payments.filter((p) => p.status === 'success');

    // Group successful payments by date/month
    const revenueByGroup: Record<string, number> = {};

    successfulPayments.forEach((p) => {
      const dateStr = p.createdAt;
      let key = 'unknown';
      try {
        const d = new Date(dateStr);
        if (period === 'monthly') {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = d.toISOString().split('T')[0];
        }
      } catch {
        key = 'invalid-date';
      }
      revenueByGroup[key] = (revenueByGroup[key] || 0) + Number(p.amount);
    });

    const dataPoints = Object.entries(revenueByGroup).map(([label, value]) => ({
      label,
      value,
    })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      period,
      dataPoints,
    };
  }

  async getSignupAnalytics() {
    const users = await this.userRepo.findAllProfiles();
    const signupsByMonth: Record<string, number> = {};

    users.forEach((u) => {
      const dateStr = u.createdAt;
      let key = 'unknown';
      try {
        const d = new Date(dateStr);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch {
        key = 'invalid-date';
      }
      signupsByMonth[key] = (signupsByMonth[key] || 0) + 1;
    });

    return Object.entries(signupsByMonth).map(([month, count]) => ({
      month,
      count,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
}
