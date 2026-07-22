import { useState } from 'react';
import { chatApi } from '../api/chat.api';
import { Message } from '../types';

export function useChat(roomId?: string) {
  const [isTyping, setIsTyping] = useState(false);

  const respondToMessage = async (payload: {
    modelName: string;
    modelCategory: string;
    modelBiography: string;
    messages: Message[];
    userMessage: string;
    clientId: string;
    modelId: string;
  }) => {
    setIsTyping(true);
    try {
      const response = await chatApi.respond(payload);
      return response;
    } catch (e) {
      console.error('Chat advice failed:', e);
      throw e;
    } finally {
      setIsTyping(false);
    }
  };

  return { isTyping, respondToMessage };
}
