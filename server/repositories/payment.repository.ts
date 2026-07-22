/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { Payment } from '../types';

const LOCAL_PAYMENTS_FILE = path.join(process.cwd(), 'local_payments.json');

function getLocalPayments(): Payment[] {
  try {
    if (fs.existsSync(LOCAL_PAYMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_PAYMENTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local payments file:', e);
  }
  return [];
}

function saveLocalPayments(payments: Payment[]) {
  try {
    fs.writeFileSync(LOCAL_PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local payments file:', e);
  }
}

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export class PaymentRepository {
  async findAll(): Promise<Payment[]> {
    let dbPayments: Payment[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('payments').select('*'),
          2500
        );
        if (!error && data) {
          dbPayments = data.map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            userName: 'Client',
            userEmail: 'client@example.com',
            amount: Number(p.amount) || 0,
            paymentGateway: (p.payment_gateway === 'Stripe' || p.payment_gateway === 'Razorpay') ? p.payment_gateway : 'Razorpay',
            status: (p.status === 'captured' || p.status === 'authorized') ? 'success' : p.status,
            description: p.description || '',
            createdAt: p.created_at,
            invoiceId: p.invoice_id,
            sessionId: p.session_id,
            modelId: p.model_id,
            modelName: 'Model',
          })) as Payment[];
        }
      } catch (e) {
        console.error('Supabase payments query failed:', e);
      }
    }

    const localPayments = getLocalPayments();
    const mergedMap = new Map<string, Payment>();
    localPayments.forEach((p) => mergedMap.set(p.id, p));
    dbPayments.forEach((p) => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<Payment | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const queryId = isValidUUID(id) ? id : null;
        if (queryId) {
          const { data, error } = await withTimeout(
            supabaseAdmin.from('payments').select('*').eq('id', queryId).maybeSingle(),
            2500
          );
          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              userName: 'Client',
              userEmail: 'client@example.com',
              amount: Number(data.amount) || 0,
              paymentGateway: (data.payment_gateway === 'Stripe' || data.payment_gateway === 'Razorpay') ? data.payment_gateway : 'Razorpay',
              status: (data.status === 'captured' || data.status === 'authorized') ? 'success' : data.status,
              description: data.description || '',
              createdAt: data.created_at,
              invoiceId: data.invoice_id,
              sessionId: data.session_id,
              modelId: data.model_id,
              modelName: 'Model',
            } as Payment;
          }
        }
      } catch (e) {
        console.error(`Supabase query for payment ${id} failed:`, e);
      }
    }

    const localPayments = getLocalPayments();
    return localPayments.find((p) => p.id === id) || null;
  }

  async save(payment: Payment): Promise<Payment> {
    const localPayments = getLocalPayments();
    const idx = localPayments.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      localPayments[idx] = payment;
    } else {
      localPayments.push(payment);
    }
    saveLocalPayments(localPayments);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const dbId = isValidUUID(payment.id) ? payment.id : undefined;
        const dbUserId = isValidUUID(payment.userId) ? payment.userId : null;
        const dbModelId = isValidUUID(payment.modelId) ? payment.modelId : null;
        const dbInvoiceId = isValidUUID(payment.invoiceId) ? payment.invoiceId : null;
        const dbStatus = payment.status === 'success' ? 'captured' : payment.status;
        const dbGateway = (payment.paymentGateway === 'Stripe' || payment.paymentGateway === 'Razorpay') ? payment.paymentGateway : 'Razorpay';

        const upsertPayload: any = {
          user_id: dbUserId,
          amount: payment.amount,
          payment_gateway: dbGateway,
          status: dbStatus,
          description: payment.description || null,
          session_id: payment.sessionId || null,
          model_id: dbModelId,
          invoice_id: dbInvoiceId,
        };

        if (dbId) {
          upsertPayload.id = dbId;
        }

        const { error } = await withTimeout(
          supabaseAdmin.from('payments').upsert(upsertPayload),
          2500
        );
        if (error) throw error;
        console.log(`Payment ${payment.id} successfully saved to Supabase.`);
      } catch (e: any) {
        console.warn(`Supabase upsert failed for payment ${payment.id}:`, e.message || e);
      }
    }

    return payment;
  }
}
