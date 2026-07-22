import React from 'react';
import DashboardPage from '../DashboardPage';

export default function PaymentsIndex() {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 uppercase tracking-tight">Payments Ledger</h2>
      <DashboardPage />
    </div>
  );
}
