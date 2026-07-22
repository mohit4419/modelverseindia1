/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useBooking } from '../context/BookingContext';

export function usePayments() {
  const {
    payments,
    setPayments,
    showPremiumModal,
    setShowPremiumModal,
    targetModelForPremium,
    setTargetModelForPremium,
    premiumPlanType,
    setPremiumPlanType,
    showMockCheckout,
    setShowMockCheckout,
    mockCheckoutData,
    setMockCheckoutData,
    verifyingPayment,
    setVerifyingPayment,
    handlePremiumUnlockSuccess,
    handleAddPaymentRecord
  } = useBooking();

  return {
    payments,
    setPayments,
    showPremiumModal,
    setShowPremiumModal,
    targetModelForPremium,
    setTargetModelForPremium,
    premiumPlanType,
    setPremiumPlanType,
    showMockCheckout,
    setShowMockCheckout,
    mockCheckoutData,
    setMockCheckoutData,
    verifyingPayment,
    setVerifyingPayment,
    handlePremiumUnlockSuccess,
    handleAddPaymentRecord
  };
}
