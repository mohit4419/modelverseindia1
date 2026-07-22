/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { PaymentRecord } from '../../types';
import { isSupabaseAvailable, removeUndefined, ensureUserExistsInDb, ensureModelExistsInDb } from './helpers';
import { SEED_PAYMENTS, SEED_USERS, SEED_MODELS } from './seedData';

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export const paymentService = {
  async getPayments(): Promise<PaymentRecord[]> {
    let dbPayments: PaymentRecord[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('payments').select('*');
        if (!error && data) {
          dbPayments = data.map((p: any) => ({
            id: p.id,
            userId: p.user_id || p.userId || 'anonymous_user',
            userName: p.userName || 'Client',
            userEmail: p.userEmail || 'client@example.com',
            amount: Number(p.amount) || 0,
            paymentGateway: p.payment_gateway || p.paymentGateway || 'Razorpay',
            status: (p.status === 'captured' || p.status === 'authorized') ? 'success' : (p.status || 'pending'),
            description: p.description || '',
            createdAt: p.created_at || p.createdAt || new Date().toISOString(),
            invoiceId: p.invoice_id || p.invoiceId || '',
            sessionId: p.session_id || p.sessionId || '',
            modelId: p.model_id || p.modelId || '',
          })) as PaymentRecord[];
        }
      } catch (e) {
        console.error('Supabase payments fetch failed', e);
      }
    }
    const local = localStorage.getItem('mvi_payments');
    const localPayments: PaymentRecord[] = local ? JSON.parse(local) : SEED_PAYMENTS;

    const mergedMap = new Map<string, PaymentRecord>();
    SEED_PAYMENTS.forEach(p => mergedMap.set(p.id, p));
    localPayments.forEach(p => mergedMap.set(p.id, p));
    dbPayments.forEach(p => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  },

  async addPayment(payment: PaymentRecord): Promise<void> {
    try {
      const payments = await this.getPayments();
      payments.push(payment);
      localStorage.setItem('mvi_payments', JSON.stringify(payments));
    } catch (localErr) {
      console.error('Local storage addPayment failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await ensureUserExistsInDb(payment.userId, payment.userName, payment.userEmail, SEED_USERS);
        if (payment.modelId) {
          await ensureModelExistsInDb(payment.modelId, SEED_MODELS);
        }

        const dbPayload: any = {
          amount: payment.amount,
          payment_gateway: payment.paymentGateway,
          status: payment.status === 'success' ? 'captured' : payment.status,
          description: payment.description || null,
          session_id: payment.sessionId || null,
        };

        if (payment.id && isValidUUID(payment.id)) {
          dbPayload.id = payment.id;
        }
        if (payment.userId && isValidUUID(payment.userId)) {
          dbPayload.user_id = payment.userId;
        }
        if (payment.modelId && isValidUUID(payment.modelId)) {
          dbPayload.model_id = payment.modelId;
        }
        if (payment.invoiceId && isValidUUID(payment.invoiceId)) {
          dbPayload.invoice_id = payment.invoiceId;
        }

        const { error } = await supabase
          .from('payments')
          .insert(dbPayload);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase payments add failed (falling back to local):', e);
      }
    }
  },

  getUnlockedProfiles(): string[] {
    const local = localStorage.getItem('mvi_unlocked_profiles');
    return local ? JSON.parse(local) : ['m4', 'm6'];
  },

  unlockProfile(modelId: string): void {
    const unlocked = this.getUnlockedProfiles();
    if (!unlocked.includes(modelId)) {
      unlocked.push(modelId);
      localStorage.setItem('mvi_unlocked_profiles', JSON.stringify(unlocked));
    }
  },

  async verifyPaymentRecordBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    if (!sessionId) return null;

    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .or(`session_id.eq.${sessionId},session_id.eq.null`)
          .maybeSingle();
        const finalData = data || null;
        if (!error && finalData) {
          return {
            id: finalData.id,
            userId: finalData.user_id || finalData.userId || 'anonymous_user',
            userName: finalData.userName || 'Client',
            userEmail: finalData.userEmail || 'client@example.com',
            amount: Number(finalData.amount) || 0,
            paymentGateway: finalData.payment_gateway || finalData.paymentGateway || 'Razorpay',
            status: (finalData.status === 'captured' || finalData.status === 'authorized') ? 'success' : (finalData.status || 'pending'),
            description: finalData.description || '',
            createdAt: finalData.created_at || finalData.createdAt || new Date().toISOString(),
            invoiceId: finalData.invoice_id || finalData.invoiceId || '',
            sessionId: finalData.session_id || finalData.sessionId || '',
            modelId: finalData.model_id || finalData.modelId || '',
          } as PaymentRecord;
        }
      } catch (e) {
        console.error('Supabase verifyPaymentRecordBySessionId query failed', e);
      }
    }

    try {
      const allPayments = await this.getPayments();
      const match = allPayments.find(p => p.sessionId === sessionId);
      return match || null;
    } catch (err) {
      console.error('Local fallback for verifying payment record failed:', err);
      return null;
    }
  },

  async verifySessionAndUnlockProfile(modelId: string, sessionId: string): Promise<boolean> {
    if (!sessionId || !modelId) return false;

    const paymentRecord = await this.verifyPaymentRecordBySessionId(sessionId);

    if (paymentRecord && paymentRecord.status === 'success' && paymentRecord.modelId === modelId) {
      this.unlockProfile(modelId);
      return true;
    }

    return false;
  }
};
