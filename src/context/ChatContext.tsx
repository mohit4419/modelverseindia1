import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '../types';
import { dbService } from '../services/db';

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (senderId: string, receiverId: string, text: string) => Promise<void>;
  clearChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const msgs = await dbService.getMessages();
        setMessages(msgs);
      } catch (e) {
        console.error('Failed to load messages from DB Service', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      receiverId,
      content: text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    await dbService.addMessage(newMsg);
  };

  const clearChats = async () => {
    setMessages([]);
    await dbService.clearAllMessages();
  };

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearChats }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
