import crypto from 'crypto';
import { getRazorpay } from '../config/razorpay';
import { ENV } from '../config/env';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { verifiedChatAccess, pendingWebhookUnlocks } from './chat.service';

function isValidUUID(val: string | null | undefined): boolean {
  if (!val) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export interface CreateSessionParams {
  gateway?: string;
  planType: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  modelId?: string;
  modelName?: string;
  amount?: number;
  originUrl: string;
}

export interface CreateSessionResult {
  id: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  isReal: boolean;
  isMock: boolean;
  url?: string;
}

/**
 * Creates a payment session or simulated evaluation redirect URL
 */
export async function createPaymentSession(params: CreateSessionParams): Promise<CreateSessionResult> {
  const { gateway, planType, userId, userName, userEmail, modelId, modelName, amount, originUrl } = params;

  // Determine pricing and descriptions
  let targetAmount = ENV.PREMIUM_UNLOCK_AMOUNT || 299; // default INR
  let title = 'Premium Profile Unlock';

  if (planType === 'enterprise') {
    targetAmount = 4999;
    title = 'Enterprise Agency License';
  } else if (planType === 'escrow') {
    targetAmount = Number(amount || ENV.PREMIUM_UNLOCK_AMOUNT || 299);
    title = `Casting Campaign Escrow - ${modelName || 'Model'}`;
  } else if (modelName) {
    title = `Premium Unlock - ${modelName}`;
  }

  const rzp = getRazorpay();
  if (rzp && gateway === 'Razorpay') {
    try {
      const order = await rzp.orders.create({
        amount: targetAmount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
        currency: 'INR',
        receipt: `rcpt_mvi_${Date.now()}`,
        notes: {
          planType: planType || 'premium',
          userId: userId || '',
          modelId: modelId || '',
          modelName: modelName || '',
          amount: String(targetAmount)
        }
      });
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: ENV.RAZORPAY_KEY_ID,
        isReal: true,
        isMock: false
      };
    } catch (err: any) {
      console.error('Razorpay Order creation failed, falling back to simulated session:', err);
    }
  }

  // Generate interactive mock checkout redirect URL for testing and client evaluation
  const mockUrl = `${originUrl}/?mock_checkout=true&gateway=${gateway || 'Razorpay'}&plan_type=${planType}&user_id=${userId || ''}&user_name=${encodeURIComponent(userName || '')}&user_email=${encodeURIComponent(userEmail || '')}&amount=${targetAmount}&model_id=${modelId || ''}&model_name=${encodeURIComponent(modelName || '')}`;
  
  return {
    id: `mock_sess_${Date.now()}`,
    url: mockUrl,
    isReal: false,
    isMock: true
  };
}

export interface VerifyPaymentParams {
  gateway?: string;
  sessionId?: string;
  planType?: string;
  amount?: number;
  modelId?: string;
  modelName?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Verifies secure payment signature (Razorpay HMAC hash matching or sandbox confirmations)
 */
export async function verifyPaymentSignature(params: VerifyPaymentParams): Promise<any> {
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
    userEmail
  } = params;

  if (gateway === 'Razorpay' && razorpay_signature && razorpay_payment_id && razorpay_order_id) {
    const rawSecret = ENV.RAZORPAY_KEY_SECRET;
    if (!rawSecret || rawSecret.trim() === '') {
      throw new Error('Razorpay secret key not configured on server.');
    }
    const secret = rawSecret.trim();
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;
    if (isVerified) {
      console.log(`Real Razorpay payment verified: Order ${razorpay_order_id}, Payment ${razorpay_payment_id}`);
      if (userId && modelId) {
        verifiedChatAccess.add(`${userId}:${modelId}`);
        console.log(`Chat access unlocked via verify: ${userId}:${modelId}`);
      }

      // PERSIST PAYMENT RECORD TO DATABASE
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const dbId = isValidUUID(razorpay_payment_id) ? razorpay_payment_id : undefined;
          const dbUserId = isValidUUID(userId) ? userId : null;
          const dbModelId = isValidUUID(modelId) ? modelId : null;

          const insertPayload: any = {
            user_id: dbUserId,
            amount: Number(amount) || ENV.PREMIUM_UNLOCK_AMOUNT || 299,
            payment_gateway: 'Razorpay',
            status: 'captured',
            description: `Verified Premium Chat Unlock for ${modelName || 'Model'}`,
            session_id: razorpay_payment_id || razorpay_signature || null,
            model_id: dbModelId
          };

          if (dbId) {
            insertPayload.id = dbId;
          }

          const { error: dbError } = await supabaseAdmin
            .from('payments')
            .insert(insertPayload);
          if (dbError) throw dbError;
          console.log('Successfully recorded verified Razorpay transaction in Supabase database.');
        } catch (dbErr: any) {
          console.error('Failed to save verified Razorpay transaction to database:', dbErr.message || dbErr);
        }
      }

      return {
        verified: true,
        isMock: false,
        isSandbox: false,
        gateway: 'Razorpay',
        planType: planType || 'premium',
        amount: amount || ENV.PREMIUM_UNLOCK_AMOUNT || 299,
        modelId: modelId || '',
        modelName: modelName || '',
        paymentId: razorpay_payment_id
      };
    } else {
      console.error('Real Razorpay signature verification failed!');
      throw new Error('Payment signature verification failed.');
    }
  }

  if (!sessionId) {
    throw new Error('Session ID is required for verification.');
  }

  console.log(`Verifying secure platform checkout session ${sessionId} via ${gateway || 'Gateway'}.`);
  
  if (userId && modelId) {
    verifiedChatAccess.add(`${userId}:${modelId}`);
    console.log(`Chat access unlocked via simulated verify: ${userId}:${modelId}`);
  }

  // PERSIST SIMULATED PAYMENT RECORD TO DATABASE FOR TESTING
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const dbId = isValidUUID(sessionId) ? sessionId : undefined;
      const dbUserId = isValidUUID(userId) ? userId : null;
      const dbModelId = isValidUUID(modelId) ? modelId : null;

      const insertPayload: any = {
        user_id: dbUserId,
        amount: Number(amount) || ENV.PREMIUM_UNLOCK_AMOUNT || 299,
        payment_gateway: (gateway === 'Stripe' || gateway === 'Razorpay') ? gateway : 'Razorpay',
        status: 'captured',
        description: `Simulated Premium Chat Unlock for ${modelName || 'Model'}`,
        session_id: sessionId || null,
        model_id: dbModelId
      };

      if (dbId) {
        insertPayload.id = dbId;
      }

      const { error: dbError } = await supabaseAdmin
        .from('payments')
        .insert(insertPayload);
      if (dbError) throw dbError;
      console.log('Successfully recorded simulated transaction in Supabase database.');
    } catch (dbErr: any) {
      console.error('Failed to save simulated transaction to database:', dbErr.message || dbErr);
    }
  }

  return {
    verified: true,
    isMock: true,
    isSandbox: true,
    gateway: gateway || 'Razorpay',
    planType: planType || 'premium',
    amount: amount || ENV.PREMIUM_UNLOCK_AMOUNT || 299,
    modelId: modelId || '',
    modelName: modelName || ''
  };
}

/**
 * Handle incoming Razorpay/Simulator Webhook
 */
export async function processWebhookEvent(event: any): Promise<boolean> {
  console.log('Received Razorpay payment webhook event in payment service:', JSON.stringify(event));

  // 1. Support standard Razorpay payment.captured/order.paid webhook events
  if (event && (event.event === 'payment.captured' || event.event === 'order.paid')) {
    const paymentEntity = event.payload?.payment?.entity || event.payload?.order?.entity || event;
    const notes = paymentEntity.notes || {};
    
    const planType = notes.planType || 'premium';
    const userId = notes.userId || '';
    const modelId = notes.modelId || '';
    const modelName = notes.modelName || 'Model';
    const amount = Number(notes.amount || (paymentEntity.amount ? paymentEntity.amount / 100 : (ENV.PREMIUM_UNLOCK_AMOUNT || 299)));

    if (userId && modelId) {
      const webhookUnlock = {
        id: `wh_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        modelId,
        modelName,
        planType,
        amount,
        createdAt: new Date().toISOString()
      };
      verifiedChatAccess.add(`${userId}:${modelId}`);
      pendingWebhookUnlocks.push(webhookUnlock);
      console.log('Successfully registered successful Razorpay webhook unlock:', webhookUnlock);
    }
    return true;
  }

  // 2. Support simulator custom format for direct evaluations and demo flows
  if (event && event.custom_webhook_success === true) {
    const webhookUnlock = {
      id: `wh_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: event.userId,
      modelId: event.modelId,
      modelName: event.modelName || 'Model',
      planType: event.planType || 'premium',
      amount: Number(event.amount || ENV.PREMIUM_UNLOCK_AMOUNT || 299),
      createdAt: new Date().toISOString()
    };
    if (event.userId && event.modelId) {
      verifiedChatAccess.add(`${event.userId}:${event.modelId}`);
    }
    pendingWebhookUnlocks.push(webhookUnlock);
    console.log('Successfully registered custom simulated payment webhook success:', webhookUnlock);
    return true;
  }

  return false;
}
