/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notificationService = new NotificationService();

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId || req.headers['x-user-id']) as string;
    let list;
    if (userId) {
      list = await notificationService.getUserNotifications(userId);
    } else {
      list = await notificationService.getAllNotifications();
    }
    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/notifications/send-bulk', async (req: Request, res: Response) => {
  try {
    const { userIds, title, body } = req.body;
    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ success: false, error: 'userIds (array), title, and body are required.' });
    }
    const created = await notificationService.sendBulk(userIds, title, body);
    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await notificationService.markAsRead(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }
    return res.status(200).json({ success: true, message: 'Notification marked as read successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Backward Compatibility
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const list = await notificationService.getUserNotifications(userId);
    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await notificationService.markAsRead(id);
    return res.status(200).json({ success, message: success ? 'Marked read.' : 'Notification not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
