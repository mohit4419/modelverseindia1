import React from 'react';
import BookingPage from '../BookingPage';

export default function FavoritesIndex() {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 uppercase tracking-tight">Saved Shortlists</h2>
      <BookingPage />
    </div>
  );
}
