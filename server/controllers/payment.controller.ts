/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { createPaymentSession, verifyPaymentSignature, processWebhookEvent } from '../services/payment.service';
import { pendingWebhookUnlocks } from '../services/chat.service';

export class PaymentController {
  static async createSession(req: Request, res: Response) {
    try {
      const { gateway, planType, userId, userName, userEmail, modelId, modelName, amount } = req.body;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'localhost:3000';
      const originUrl = `${protocol}://${host}`;

      const session = await createPaymentSession({
        gateway,
        planType,
        userId,
        userName,
        userEmail,
        modelId,
        modelName,
        amount,
        originUrl,
      });

      return res.status(200).json(session);
    } catch (err: any) {
      console.error('Error in createSession controller:', err);
      return res.status(500).json({ error: 'Failed to create payment session.', details: err.message });
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const {
        gateway,
        sessionId,
        planType,
        amount,
        modelId,
        modelName,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        userId,
        userName,
        userEmail,
      } = req.body;

      const result = await verifyPaymentSignature({
        gateway,
        sessionId,
        planType,
        amount,
        modelId,
        modelName,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        userId,
        userName,
        userEmail,
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Error in verifyPayment controller:', err);
      return res.status(400).json({ error: err.message || 'Signature verification failed' });
    }
  }

  static async getPendingUnlocks(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      pending: pendingWebhookUnlocks,
    });
  }

  static async handleRazorpayWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      console.log(`Razorpay webhook signature: ${signature}`);
      
      const eventProcessed = await processWebhookEvent(req.body);
      if (eventProcessed) {
        return res.status(200).json({ status: 'ok', message: 'Webhook registered successfully.' });
      }
      return res.status(400).json({ error: 'Unrecognized event type' });
    } catch (err: any) {
      console.error('Webhook processing failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async createOrder(req: Request, res: Response) {
    // Exact mapping for POST /payments/create-order
    return PaymentController.createSession(req, res);
  }

  static async getHistory(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId || 'anonymous_user';
      let paymentsList: any[] = [];
      const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('payments').select('*');
        if (!error && data) {
          paymentsList = data;
        }
      }
      return res.status(200).json({ success: true, data: paymentsList });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let paymentRecord: any = null;
      const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('payments').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          paymentRecord = data;
        }
      }
      if (!paymentRecord) {
        return res.status(404).json({ success: false, error: 'Payment record not found.' });
      }
      return res.status(200).json({ success: true, data: paymentRecord });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async refund(req: Request, res: Response) {
    try {
      const { paymentId, reason } = req.body;
      if (!paymentId) return res.status(400).json({ success: false, error: 'paymentId is required.' });
      return res.status(200).json({ success: true, message: 'Refund initiated successfully (Simulated).', data: { paymentId, reason, status: 'refunded' } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      return res.status(200).json({
        success: true,
        data: {
          invoiceId: `INV-${id}`,
          paymentId: id,
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          amount: 299,
          currency: 'INR',
          status: 'paid',
          companyName: 'ModelVerse India'
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
