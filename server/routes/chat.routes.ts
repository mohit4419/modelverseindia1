/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();

// Chat V1 REST API
router.get('/chat/rooms', ChatController.getRooms);
router.get('/chat/messages/:roomId', ChatController.getRoomMessages);
router.post('/chat/messages', ChatController.postMessage);
router.post('/chat/rooms', ChatController.postRoom);
router.delete('/chat/clear', ChatController.clearChats);

// Interactive AI Companion / Responder
router.post('/chat/respond', ChatController.respond);
router.post('/chat/coach', ChatController.coach);

export default router;
