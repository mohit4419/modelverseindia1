import { paymentsApi } from '../api/payments.api';

export const paymentService = {
  async createSession(data: any) {
    return paymentsApi.createSession(data);
  },

  async verifyPayment(data: any) {
    return paymentsApi.verifyPayment(data);
  },

  async getPendingUnlocks() {
    return paymentsApi.getPendingUnlocks();
  }
};
