/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface ChatRoom {
  id: string;
  clientId: string;
  clientName: string;
  modelId: string;
  modelName: string;
  modelImage?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  bookingId?: string;
  isActive?: boolean;
  closedAt?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  messageType?: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

const LOCAL_ROOMS_FILE = path.join(process.cwd(), 'local_chat_rooms.json');
const LOCAL_MESSAGES_FILE = path.join(process.cwd(), 'local_chat_messages.json');

function getLocalRooms(): ChatRoom[] {
  try {
    if (fs.existsSync(LOCAL_ROOMS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_ROOMS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local rooms:', e);
  }
  return [];
}

function saveLocalRooms(rooms: ChatRoom[]) {
  try {
    fs.writeFileSync(LOCAL_ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local rooms:', e);
  }
}

function getLocalMessages(): ChatMessage[] {
  try {
    if (fs.existsSync(LOCAL_MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_MESSAGES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local messages:', e);
  }
  return [];
}

function saveLocalMessages(messages: ChatMessage[]) {
  try {
    fs.writeFileSync(LOCAL_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local messages:', e);
  }
}

export class ChatRepository {
  async findAllRooms(): Promise<ChatRoom[]> {
    let dbRooms: ChatRoom[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: roomsData, error: roomsError } = await withTimeout(
          supabaseAdmin.from('chat_rooms').select('*'),
          3500
        );
        if (!roomsError && roomsData) {
          const clientIds = [...new Set(roomsData.map(r => r.client_id).filter(Boolean))];
          const modelIds = [...new Set(roomsData.map(r => r.model_id).filter(Boolean))];

          // Bulk fetch users
          const { data: usersData } = await withTimeout(
            supabaseAdmin.from('users').select('id, full_name, avatar').in('id', clientIds),
            2000
          );

          // Bulk fetch models
          const { data: modelsData } = await withTimeout(
            supabaseAdmin.from('models').select('id, name').in('id', modelIds),
            2000
          );

          // Bulk fetch model portfolio images (first image)
          const { data: portfolioData } = await withTimeout(
            supabaseAdmin.from('portfolio_images').select('model_id, image_url').in('model_id', modelIds),
            2000
          );

          const userMap = new Map<string, any>(usersData?.map(u => [u.id, u]) || []);
          const modelMap = new Map<string, any>(modelsData?.map(m => [m.id, m]) || []);
          
          const imageMap = new Map<string, string>();
          portfolioData?.forEach(p => {
            if (!imageMap.has(p.model_id)) {
              imageMap.set(p.model_id, p.image_url);
            }
          });

          dbRooms = roomsData.map((r: any) => {
            const user = userMap.get(r.client_id);
            const model = modelMap.get(r.model_id);
            return {
              id: r.id,
              clientId: r.client_id,
              clientName: user?.full_name || 'Client',
              modelId: r.model_id,
              modelName: model?.name || 'Model',
              modelImage: imageMap.get(r.model_id) || user?.avatar || '',
              lastMessage: r.last_message || 'Room created',
              lastMessageAt: r.last_message_at || r.created_at,
              createdAt: r.created_at,
              bookingId: r.booking_id || undefined,
              isActive: r.is_active,
              closedAt: r.closed_at
            };
          });
        }
      } catch (e) {
        console.error('Supabase query chat_rooms failed:', e);
      }
    }

    const localRooms = getLocalRooms();
    const mergedMap = new Map<string, ChatRoom>();
    localRooms.forEach((r) => mergedMap.set(r.id, r));
    dbRooms.forEach((r) => mergedMap.set(r.id, r));
    return Array.from(mergedMap.values()).sort((a, b) => 
      new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()
    );
  }

  async findRoomById(id: string): Promise<ChatRoom | null> {
    const all = await this.findAllRooms();
    return all.find((r) => r.id === id) || null;
  }

  async saveRoom(room: ChatRoom): Promise<ChatRoom> {
    const rooms = getLocalRooms();
    const idx = rooms.findIndex((r) => r.id === room.id);
    if (idx >= 0) {
      rooms[idx] = room;
    } else {
      rooms.push(room);
    }
    saveLocalRooms(rooms);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const dbPayload = {
          id: room.id,
          client_id: room.clientId,
          model_id: room.modelId,
          last_message: room.lastMessage || 'Room created',
          last_message_at: room.lastMessageAt || new Date().toISOString(),
          booking_id: room.bookingId || null,
          is_active: room.isActive !== undefined ? room.isActive : true,
          closed_at: room.closedAt || null
        };
        await withTimeout(
          supabaseAdmin.from('chat_rooms').upsert(dbPayload),
          2500
        );
      } catch (e) {
        console.error('Supabase upsert chat_room failed:', e);
      }
    }
    return room;
  }

  async findMessagesByRoomId(roomId: string): Promise<ChatMessage[]> {
    let dbMessages: ChatMessage[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: msgsData, error } = await withTimeout(
          supabaseAdmin.from('chat_messages').select('*').eq('room_id', roomId),
          3500
        );
        if (!error && msgsData) {
          const senderIds = [...new Set(msgsData.map(m => m.sender_id).filter(Boolean))];

          // Fetch sender names from users or models
          const { data: usersData } = await withTimeout(
            supabaseAdmin.from('users').select('id, full_name').in('id', senderIds),
            2000
          );
          const { data: modelsData } = await withTimeout(
            supabaseAdmin.from('models').select('id, name').in('id', senderIds),
            2000
          );

          const senderMap = new Map<string, string>();
          usersData?.forEach(u => senderMap.set(u.id, u.full_name));
          modelsData?.forEach(m => senderMap.set(m.id, m.name));

          dbMessages = msgsData.map((m: any) => ({
            id: m.id,
            roomId: m.room_id,
            senderId: m.sender_id,
            senderName: senderMap.get(m.sender_id) || 'User',
            content: m.content,
            createdAt: m.created_at,
            messageType: m.message_type,
            isEdited: m.is_edited,
            editedAt: m.edited_at,
            isDeleted: m.is_deleted,
            deletedAt: m.deleted_at
          })) as ChatMessage[];
        }
      } catch (e) {
        console.error('Supabase query chat_messages failed:', e);
      }
    }

    const localMessages = getLocalMessages();
    const filteredLocal = localMessages.filter((m) => m.roomId === roomId);
    const mergedMap = new Map<string, ChatMessage>();
    filteredLocal.forEach((m) => mergedMap.set(m.id, m));
    dbMessages.forEach((m) => mergedMap.set(m.id, m));
    return Array.from(mergedMap.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async saveMessage(msg: ChatMessage): Promise<ChatMessage> {
    const messages = getLocalMessages();
    messages.push(msg);
    saveLocalMessages(messages);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const dbPayload = {
          id: msg.id,
          room_id: msg.roomId,
          sender_id: msg.senderId,
          content: msg.content,
          message_type: msg.messageType || 'text',
          is_edited: msg.isEdited || false,
          edited_at: msg.editedAt || null,
          is_deleted: msg.isDeleted || false,
          deleted_at: msg.deletedAt || null,
          created_at: msg.createdAt || new Date().toISOString()
        };
        await withTimeout(
          supabaseAdmin.from('chat_messages').insert(dbPayload),
          2500
        );
      } catch (e) {
        console.error('Supabase insert chat_message failed:', e);
      }
    }

    // Update room last message info
    const room = await this.findRoomById(msg.roomId);
    if (room) {
      room.lastMessage = msg.content;
      room.lastMessageAt = msg.createdAt;
      await this.saveRoom(room);
    }

    return msg;
  }

  async clearAll(): Promise<void> {
    saveLocalRooms([]);
    saveLocalMessages([]);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await withTimeout(
          supabaseAdmin.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          2500
        );
        await withTimeout(
          supabaseAdmin.from('chat_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          2500
        );
      } catch (e) {
        console.error('Supabase clear chat data failed:', e);
      }
    }
  }
}
