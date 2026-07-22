/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { AuditLog } from '../../types';
import { isSupabaseAvailable } from './helpers';
import { SEED_AUDIT_LOGS } from './seedData';

// Strong types for DB interactions
interface DbAuditLog {
  id: string;
  transaction_id?: string | null;
  action: string;
  performed_by: string;
  resource?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: { details?: string } | null;
  created_at: string;
  users?: {
    email: string | null;
    full_name: string | null;
  } | null;
}

export const auditService = {
  subscribeToAuditLogs(callback: (logs: AuditLog[]) => void): () => void {
    if (isSupabaseAvailable && supabase) {
      const channel = supabase
        .channel('schema-db-changes-audit-logs')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'audit_logs' },
          async () => {
            const fresh = await this.getAuditLogs();
            callback(fresh);
          }
        )
        .subscribe();

      this.getAuditLogs().then(callback);

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      this.getAuditLogs().then(callback);
      return () => {};
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, users!performed_by(email, full_name)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          return (data as unknown as DbAuditLog[]).map((r) => {
            const u = r.users;
            const userIdentifier = u ? (u.email || u.full_name) : null;
            return {
              id: r.id,
              action: r.action,
              performedBy: userIdentifier || r.performed_by || 'System Admin',
              details: r.metadata?.details || '',
              timestamp: r.created_at || new Date().toISOString(),
              entityId: r.resource_id || undefined,
              entityType: r.resource as any
            };
          });
        } else if (error) {
          console.warn('Supabase audit logs fetch query error, falling back to local:', error);
        }
      } catch (e) {
        console.error('Supabase audit logs fetch failed:', e);
      }
    }

    // Offline / Local fallback: Local storage & Seed logs ONLY when Supabase isn't active
    const local = localStorage.getItem('mvi_audit_logs');
    const localLogs: AuditLog[] = local ? JSON.parse(local) : SEED_AUDIT_LOGS;
    return [...localLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'performedBy'> & { id?: string; timestamp?: string; performedBy?: string }): Promise<void> {
    const fullLog: AuditLog = {
      id: log.id || `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      action: log.action,
      performedBy: log.performedBy || 'System Admin',
      details: log.details,
      entityId: log.entityId,
      entityType: log.entityType
    };

    // Save offline/locally anyway for general fallback persistence
    try {
      const local = localStorage.getItem('mvi_audit_logs');
      const localLogs: AuditLog[] = local ? JSON.parse(local) : [...SEED_AUDIT_LOGS];
      localLogs.unshift(fullLog);
      localStorage.setItem('mvi_audit_logs', JSON.stringify(localLogs.slice(0, 100)));
    } catch (localErr) {
      console.error('Local storage addAuditLog failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        function isValidUUID(val: string | null | undefined): boolean {
          if (!val) return false;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        }

        let resolvedUserId: string | null = null;

        // 1. Check if log.performedBy is a valid UUID
        if (isValidUUID(fullLog.performedBy)) {
          resolvedUserId = fullLog.performedBy;
        }

        // 2. Fallback to current authenticated user
        if (!resolvedUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            resolvedUserId = user.id;
          }
        }

        // 3. Fallback to single quick name/email lookup
        if (!resolvedUserId && fullLog.performedBy && fullLog.performedBy !== 'System Admin') {
          const { data: matchedUser } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq."${fullLog.performedBy}",full_name.eq."${fullLog.performedBy}"`)
            .limit(1)
            .maybeSingle();
          if (matchedUser?.id) {
            resolvedUserId = matchedUser.id;
          }
        }

        // 4. Default database fallback: get the first user to maintain FK constraints
        if (!resolvedUserId) {
          const { data: fallbackUser } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .maybeSingle();
          if (fallbackUser?.id) {
            resolvedUserId = fallbackUser.id;
          }
        }

        if (resolvedUserId) {
          // Normalize resource to lowercase values
          const dbPayload: Omit<DbAuditLog, 'id'> & { id?: string } = {
            action: fullLog.action,
            performed_by: resolvedUserId,
            resource: fullLog.entityType ? fullLog.entityType.toLowerCase() : null,
            resource_id: fullLog.entityId || null,
            metadata: { details: fullLog.details },
            created_at: fullLog.timestamp,
          };

          // Database expects UUID. Do NOT insert frontend client log_ string IDs.
          if (isValidUUID(fullLog.id)) {
            dbPayload.id = fullLog.id;
          }

          // If payment entity and we have transactions matching, set transaction_id
          if (fullLog.entityType === 'payment' && isValidUUID(fullLog.entityId)) {
            const { data: tx } = await supabase
              .from('transactions')
              .select('id')
              .eq('payment_id', fullLog.entityId)
              .limit(1)
              .maybeSingle();
            if (tx?.id) {
              dbPayload.transaction_id = tx.id;
            }
          }

          const { error } = await supabase
            .from('audit_logs')
            .insert(dbPayload);
          if (error) throw error;
        }
      } catch (e) {
        console.warn('Supabase auditLogs add failed:', e);
      }
    }
  }
};
