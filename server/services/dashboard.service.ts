/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingRepository } from '../repositories/booking.repository';
import { ModelRepository } from '../repositories/model.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { UserRepository } from '../repositories/user.repository';

export class DashboardService {
  private bookingRepo = new BookingRepository();
  private modelRepo = new ModelRepository();
  private paymentRepo = new PaymentRepository();
  private userRepo = new UserRepository();

  async getDashboardStats() {
    const [bookings, models, payments, users] = await Promise.all([
      this.bookingRepo.findAll(),
      this.modelRepo.findAll(),
      this.paymentRepo.findAll(),
      this.userRepo.findAllProfiles(),
    ]);

    const totalRevenue = payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const bookingStatusCounts = bookings.reduce((acc: Record<string, number>, b) => {
      const status = b.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const modelCategoryCounts = models.reduce((acc: Record<string, number>, m) => {
      const category = m.category || 'fresh_face';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const userRoleCounts = users.reduce((acc: Record<string, number>, u) => {
      const role = u.role || 'client';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers: users.length,
      totalModels: models.length,
      totalBookings: bookings.length,
      totalRevenue,
      bookingStatusCounts,
      modelCategoryCounts,
      userRoleCounts,
      recentBookings: bookings.slice(-5).reverse(),
      recentPayments: payments.slice(-5).reverse(),
    };
  }
}
