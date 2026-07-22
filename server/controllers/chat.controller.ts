/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import {
  generateChatResponse,
  generateCoachingAdvice,
  getAllRooms,
  getRoomById,
  createRoom,
  getMessagesByRoom,
  saveNewMessage,
  clearAllChats
} from '../services/chat.service';

export class ChatController {
  static async getRooms(req: Request, res: Response) {
    try {
      const { clientId, modelId } = req.query;
      let rooms = await getAllRooms();
      if (clientId) {
        rooms = rooms.filter((r) => r.clientId === clientId);
      }
      if (modelId) {
        rooms = rooms.filter((r) => r.modelId === modelId);
      }
      return res.status(200).json({ success: true, data: rooms });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRoomMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const messages = await getMessagesByRoom(roomId);
      return res.status(200).json({ success: true, data: messages });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async postMessage(req: Request, res: Response) {
    try {
      const { roomId, senderId, senderName, content } = req.body;
      if (!roomId || !senderId || !content) {
        return res.status(400).json({ success: false, error: 'roomId, senderId, and content are required.' });
      }
      const saved = await saveNewMessage({ roomId, senderId, senderName: senderName || 'User', content });
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async postRoom(req: Request, res: Response) {
    try {
      const { clientId, clientName, modelId, modelName, modelImage } = req.body;
      if (!clientId || !modelId) {
        return res.status(400).json({ success: false, error: 'clientId and modelId are required to create a chat room.' });
      }
      const room = await createRoom({
        clientId,
        clientName: clientName || 'Client',
        modelId,
        modelName: modelName || 'Model',
        modelImage
      });
      return res.status(201).json({ success: true, data: room });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
  static async respond(req: Request, res: Response) {
    const { modelName, modelCategory, modelBiography, messages, userMessage, clientId, modelId } = req.body;

    try {
      const replyText = await generateChatResponse({
        modelName,
        modelCategory,
        modelBiography,
        messages,
        userMessage,
        clientId,
        modelId
      });

      return res.status(200).json({ reply: replyText });
    } catch (err: any) {
      if (err.message && err.message.includes('Access Denied')) {
        return res.status(403).json({ error: err.message });
      }
      console.error('Chat responder endpoint failed:', err);
      return res.status(500).json({ error: 'Failed to generate chat response', details: err.message });
    }
  }

  static async coach(req: Request, res: Response) {
    const { modelName, modelCategory, messages, budgetPrice } = req.body;

    try {
      const coachingResult = await generateCoachingAdvice({
        modelName,
        modelCategory,
        messages,
        budgetPrice
      });

      return res.status(200).json(coachingResult);
    } catch (err: any) {
      console.error('Coaching service controller failed:', err);
      return res.status(500).json({ error: 'Failed to generate coaching suggestions', details: err.message });
    }
  }

  static async clearChats(req: Request, res: Response) {
    try {
      await clearAllChats();
      return res.status(200).json({ success: true, message: 'All chat history deleted successfully.' });
    } catch (err: any) {
      console.error('Failed to clear chats:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
