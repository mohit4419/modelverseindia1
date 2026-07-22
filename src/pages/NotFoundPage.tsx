/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NotFoundPage() {
  const { setCurrentTab } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-fadeIn">
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full mb-6 border border-rose-100 dark:border-rose-900/30">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h2 className="font-sans text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Page Not Found</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
        The casting view or dashboard tab you are looking for does not exist or has been moved.
      </p>
      <button
        onClick={() => setCurrentTab('home')}
        className="mt-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 text-xs hover:brightness-110 shadow-lg hover:shadow-purple-500/20 transition active:scale-95 cursor-pointer"
      >
        Go Back Home
      </button>
    </div>
  );
}
