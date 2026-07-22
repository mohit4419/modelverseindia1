/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModels } from '../hooks/useModels';
import { useBookings } from '../hooks/useBookings';
import { useApp } from '../context/AppContext';

import AgentDashboard from '../components/dashboard/AgentDashboard';
import ClientDashboard from '../components/dashboard/ClientDashboard';

export default function DashboardPage() {
  const { currentRole, clientId } = useAuth();
  const { models } = useModels();
  const { bookings, setBookings, handleUpdateBookingStatus } = useBookings();
  const { triggerToast, currentTab, setModels } = useApp();

  // Route to Model Dashboard if role is model or tab is explicitly set
  if (currentTab === 'agent-dashboard' || currentRole === 'model') {
    return (
      <AgentDashboard
        models={models}
        bookings={bookings}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onUpdateModel={(updatedModel) => {
          setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m));
        }}
        triggerToast={triggerToast}
        onUpdateBooking={(updatedBk) => {
          setBookings(prev => prev.map(b => b.id === updatedBk.id ? updatedBk : b));
        }}
      />
    );
  }

  // Otherwise default to Client Dashboard
  return (
    <ClientDashboard
      bookings={bookings}
      models={models}
      clientId={clientId}
      triggerToast={triggerToast}
      onUpdateBookingStatus={handleUpdateBookingStatus}
    />
  );
}
