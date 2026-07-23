import { paymentsApi } from '../api/payments.api';
import { accessControlService } from './accessControl.service';

export const paymentService = {
  async createSession(data: any) {
    return paymentsApi.createSession(data);
  },

  async verifyPayment(data: any) {
    const result = await paymentsApi.verifyPayment(data);
    if (result && result.verified) {
      accessControlService.recordPaymentUnlock({
        userId: data.userId,
        modelId: data.modelId,
        planType: data.planType,
        amount: data.amount,
        paymentId: data.razorpay_payment_id || result.paymentId,
        gateway: data.gateway || 'Razorpay'
      });
    }
    return result;
  },

  async getPendingUnlocks() {
    return paymentsApi.getPendingUnlocks();
  },

  accessControl: accessControlService
};

export { accessControlService };

