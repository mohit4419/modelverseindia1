/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const paymentsApi = {
  async createSession(payload: {
    gateway?: string;
    planType: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    modelId?: string;
    modelName?: string;
    amount?: number;
  }) {
    const response = await fetch('/api/v2/payments/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create payment session');
    }
    return result;
  },

  async verifyPayment(payload: {
    gateway?: string;
    sessionId?: string;
    planType?: string;
    amount?: number;
    modelId?: string;
    modelName?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
  }) {
    const response = await fetch('/api/v2/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment');
    }
    return result;
  },

  async getPendingUnlocks() {
    const response = await fetch('/api/v2/payments/pending-unlocks');
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch pending unlocks');
    }
    return result.pending;
  }
};
