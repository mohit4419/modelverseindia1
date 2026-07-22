/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModels } from '../hooks/useModels';
import { useBookings } from '../hooks/useBookings';
import { usePayments } from '../hooks/usePayments';
import { useBooking } from '../context/BookingContext';

import AdminDashboard from '../components/admin/AdminDashboard';

export default function AdminPage() {
  const { handleAuthSuccess, currentRole } = useAuth();
  const { models } = useModels();
  const {
    handleAdminApproveModel,
    handleAdminRejectModel,
    handleAdminBatchApproveModels,
    handleAdminSuspendUser
  } = useBooking();
  const { bookings, handleUpdateBookingStatus } = useBookings();
  const { payments } = usePayments();

  // Guard page for Admin role only
  if (currentRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h3 className="font-sans text-lg font-black text-neutral-850 dark:text-neutral-200">Access Restricted</h3>
        <p className="text-xs text-neutral-500 mt-1">This page is reserved for administrator management. Please log in as an administrator.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <AdminDashboard
        models={models}
        bookings={bookings}
        payments={payments}
        onApproveModel={handleAdminApproveModel}
        onRejectModel={handleAdminRejectModel}
        onSuspendUser={handleAdminSuspendUser}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onBatchApproveModels={handleAdminBatchApproveModels}
        onImpersonateUser={(user: any) => {
          handleAuthSuccess(user, user.role);
        }}
      />
    </div>
  );
}
