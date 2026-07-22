import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn text-left">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 p-5 bg-neutral-50 dark:bg-[#0d0d0d]">
          <h3 className="font-sans text-base font-black tracking-tight text-neutral-900 dark:text-white uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 text-sm text-neutral-600 dark:text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  );
}
