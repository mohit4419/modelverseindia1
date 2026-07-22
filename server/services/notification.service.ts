/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const LOCAL_NOTIFICATIONS_FILE = path.join(process.cwd(), 'local_notifications.json');

function getLocalNotifications(): SystemNotification[] {
  try {
    if (fs.existsSync(LOCAL_NOTIFICATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_NOTIFICATIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local notifications:', e);
  }
  return [];
}

function saveLocalNotifications(notifications: SystemNotification[]) {
  try {
    fs.writeFileSync(LOCAL_NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local notifications:', e);
  }
}

function mapDbToNotification(db: any): SystemNotification {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    body: db.body,
    read: db.is_read,
    createdAt: db.created_at || db.timestamp || new Date().toISOString()
  };
}

export class NotificationService {
  async sendNotification(userId: string, title: string, body: string): Promise<SystemNotification> {
    const list = getLocalNotifications();
    const notification: SystemNotification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };

    list.push(notification);
    saveLocalNotifications(list);
    console.log(`[Notification Engine] Sent to User ${userId}: ${title} - ${body}`);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        function isValidUUID(val: string | null | undefined): boolean {
          if (!val) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }

        if (isValidUUID(userId)) {
          const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: userId,
              title,
              body,
              notification_type: 'system',
              delivery_status: 'sent',
              is_read: false,
              metadata: {}
            })
            .select()
            .maybeSingle();
          if (error) throw error;
          if (data) {
            return mapDbToNotification(data);
          }
        }
      } catch (e) {
        console.warn('[Supabase Notifications] Failed to send notification:', e);
      }
    }

    return notification;
  }

  async sendBulk(userIds: string[], title: string, body: string): Promise<SystemNotification[]> {
    const list = getLocalNotifications();
    const created: SystemNotification[] = [];
    for (const userId of userIds) {
      const notification: SystemNotification = {
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}_${userId}`,
        userId,
        title,
        body,
        read: false,
        createdAt: new Date().toISOString(),
      };
      list.push(notification);
      created.push(notification);
    }
    saveLocalNotifications(list);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        function isValidUUID(val: string | null | undefined): boolean {
          if (!val) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }

        const validUserIds = userIds.filter(isValidUUID);
        if (validUserIds.length > 0) {
          const dbPayloads = validUserIds.map(userId => ({
            user_id: userId,
            title,
            body,
            notification_type: 'system',
            delivery_status: 'sent',
            is_read: false,
            metadata: {}
          }));

          const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(dbPayloads)
            .select();
          if (error) throw error;
          if (data) {
            return data.map(mapDbToNotification);
          }
        }
      } catch (e) {
        console.warn('[Supabase Notifications] Bulk send failed:', e);
      }
    }

    return created;
  }

  async getAllNotifications(): Promise<SystemNotification[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map(mapDbToNotification);
        }
      } catch (e) {
        console.error('[Supabase Notifications] getAllNotifications failed:', e);
      }
    }
    return getLocalNotifications();
  }

  async getUserNotifications(userId: string): Promise<SystemNotification[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        function isValidUUID(val: string | null | undefined): boolean {
          if (!val) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }

        if (isValidUUID(userId)) {
          const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (!error && data) {
            return data.map(mapDbToNotification);
          }
        }
      } catch (e) {
        console.error('[Supabase Notifications] getUserNotifications failed:', e);
      }
    }
    const list = getLocalNotifications();
    return list.filter((n) => n.userId === userId);
  }

  async markAsRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        function isValidUUID(val: string | null | undefined): boolean {
          if (!val) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }

        if (isValidUUID(id)) {
          const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({
              is_read: true,
              read_at: new Date().toISOString(),
              delivery_status: 'read'
            })
            .eq('id', id)
            .select()
            .maybeSingle();
          if (!error && data) {
            return true;
          }
        }
      } catch (e) {
        console.error('[Supabase Notifications] markAsRead failed:', e);
      }
    }

    const list = getLocalNotifications();
    const notification = list.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      saveLocalNotifications(list);
      return true;
    }
    return false;
  }
}
