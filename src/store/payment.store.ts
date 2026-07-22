let cachedPayments: any[] = [];

export const paymentStore = {
  getPayments(): any[] {
    return cachedPayments;
  },

  setPayments(payments: any[]): void {
    cachedPayments = payments;
  },

  addPayment(payment: any): void {
    cachedPayments.unshift(payment);
  }
};
