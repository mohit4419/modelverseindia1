/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from '../types';

export const chatApi = {
  async respond(payload: {
    modelName: string;
    modelCategory: string;
    modelBiography: string;
    messages: Message[];
    userMessage: string;
    clientId: string;
    modelId: string;
  }): Promise<{ reply: string }> {
    const response = await fetch('/api/v2/chat/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }
    return result;
  },

  async coach(payload: {
    modelName: string;
    modelCategory: string;
    messages: Message[];
    budgetPrice?: number;
  }): Promise<any> {
    const response = await fetch('/api/v2/chat/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get coaching advice');
    }
    return result;
  },

  async clearChats(): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/v2/chat/clear', {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to clear chats');
    }
    return result;
  }
};
