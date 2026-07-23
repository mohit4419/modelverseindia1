/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Message } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureModelExistsInDb, ensureUserExistsInDb } from './helpers';
import { SEED_MESSAGES, SEED_USERS, SEED_MODELS } from './seedData';

export const messageService = {
  async getMessages(): Promise<Message[]> {
    const isCleared = localStorage.getItem('mvi_chats_cleared') === 'true';
    let dbMessages: Message[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('chat_messages').select('*');
        if (!error && data) {
          dbMessages = data as Message[];
        }
      } catch (e) {
        console.error('Supabase messages fetch failed', e);
      }
    }
    const local = localStorage.getItem('mvi_messages');
    
    if (isCleared) {
      const localMessages: Message[] = local ? JSON.parse(local) : [];
      const mergedMap = new Map<string, Message>();
      localMessages.forEach(m => mergedMap.set(m.id, m));
      dbMessages.forEach(m => mergedMap.set(m.id, m));
      return Array.from(mergedMap.values());
    }

    const localMessages: Message[] = local ? JSON.parse(local) : SEED_MESSAGES;
    const mergedMap = new Map<string, Message>();
    SEED_MESSAGES.forEach(m => mergedMap.set(m.id, m));
    localMessages.forEach(m => mergedMap.set(m.id, m));
    dbMessages.forEach(m => mergedMap.set(m.id, m));

    return Array.from(mergedMap.values());
  },

  async addMessage(msg: Message): Promise<void> {
    try {
      const msgs = await this.getMessages();
      msgs.push(msg);
      localStorage.setItem('mvi_messages', JSON.stringify(msgs));
    } catch (localErr) {
      console.error('Local storage addMessage failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        if (msg.senderId && msg.senderId !== 'system') {
          if (msg.senderId.startsWith('m')) {
            await ensureModelExistsInDb(msg.senderId, SEED_MODELS);
          } else {
            await ensureUserExistsInDb(msg.senderId, undefined, undefined, SEED_USERS);
          }
        }
        if (msg.receiverId && msg.receiverId !== 'system') {
          if (msg.receiverId.startsWith('m')) {
            await ensureModelExistsInDb(msg.receiverId, SEED_MODELS);
          } else {
            await ensureUserExistsInDb(msg.receiverId, undefined, undefined, SEED_USERS);
          }
        }
        const { error } = await supabase
          .from('chat_messages')
          .insert(removeUndefined(msg));
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase messaging save failed (falling back to local):', e);
      }
    }
  },

  async clearAllMessages(): Promise<void> {
    try {
      localStorage.setItem('mvi_messages', JSON.stringify([]));
      localStorage.setItem('mvi_chats_cleared', 'true');
    } catch (e) {
      console.error('Local storage clear messages failed:', e);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        const { error } = await supabase.from('chat_messages').delete().neq('id', '');
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase messaging clear failed:', e);
      }
    }
  }
};
