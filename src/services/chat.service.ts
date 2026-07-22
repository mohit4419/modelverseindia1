import { chatApi } from '../api/chat.api';

export const chatService = {
  async respond(payload: {
    modelName: string;
    modelCategory: string;
    modelBiography: string;
    messages: any[];
    userMessage: string;
    clientId: string;
    modelId: string;
  }) {
    return chatApi.respond(payload);
  },

  async coach(payload: {
    modelName: string;
    modelCategory: string;
    messages: any[];
    budgetPrice?: number;
  }) {
    return chatApi.coach(payload);
  },

  async clearChats() {
    return chatApi.clearChats();
  }
};
