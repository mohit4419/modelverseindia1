import React from 'react';
import { Bell, Check } from 'lucide-react';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
  };
  onMarkRead?: (id: string) => void;
}

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 text-left ${
        notification.read
          ? 'bg-neutral-50/60 dark:bg-neutral-950/20 border-neutral-100 dark:border-neutral-900 opacity-75'
          : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 shadow-sm'
      }`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${
        notification.read
          ? 'bg-neutral-100 dark:bg-neutral-950/40 text-neutral-400'
          : 'bg-purple-500/10 text-purple-650 dark:text-purple-400'
      }`}>
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-sans text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
            {notification.title}
          </h4>
          {!notification.read && onMarkRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-[9px] font-bold text-purple-650 hover:text-purple-750 uppercase tracking-widest flex items-center space-x-1 cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>Mark Read</span>
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed font-medium">
          {notification.message}
        </p>
        <span className="block text-[9px] text-neutral-400 font-mono">
          {new Date(notification.timestamp).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
