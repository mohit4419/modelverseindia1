import React from 'react';
import { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  isMe: boolean;
}

export default function ChatMessage({ message, isMe }: ChatMessageProps) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full animate-fadeIn`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs text-left ${
          isMe
            ? 'bg-purple-600 text-white rounded-tr-none'
            : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-200 dark:border-neutral-800'
        }`}
      >
        {!isMe && (
          <p className="font-extrabold text-[9px] uppercase tracking-wider text-[#D4AF37] mb-1">
            {message.senderId === 'client' ? 'Client' : 'Model'}
          </p>
        )}
        <p className="leading-relaxed whitespace-pre-line font-medium">{message.content}</p>
        <span className="block text-[8px] text-right text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
