import { Router, Request, Response } from 'express';
import { createPaymentSession, verifyPaymentSignature, processWebhookEvent } from '../services/payment.service';
import { pendingWebhookUnlocks } from '../services/chat.service';

const router = Router();

// Create payment session or simulator checkout redirect url
router.post('/payments/create-session', async (req: Request, res: Response) => {
  try {
    const { gateway, planType, userId, userName, userEmail, modelId, modelName, amount } = req.body;
    
    // Get absolute origin from standard request headers to ensure dynamic web redirection works perfectly in sandboxes
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
      originUrl
    });

    return res.json(session);
  } catch (err: any) {
    console.error('Create payment session endpoint failed:', err);
    return res.status(500).json({ error: 'Failed to create payment session.', details: err.message });
  }
});

// Verifies secure payment signature
router.post('/payments/verify', async (req: Request, res: Response) => {
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
      userEmail
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
      userEmail
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Verify payment failed:', err);
    return res.status(400).json({ error: err.message || 'Signature verification failed' });
  }
});

// Get recent webhook event notifications to inform active client sessions
const pendingUnlocksHandler = (req: Request, res: Response) => {
  return res.json({
    success: true,
    pending: pendingWebhookUnlocks,
  });
};

// Existing route
router.get('/payments/pending-unlocks', pendingUnlocksHandler);

// Backward-compatible route used by frontend
router.get('/payment/pending-webhook-unlocks', pendingUnlocksHandler);
// Secure Razorpay Webhook endpoint
router.post('/webhook/razorpay', async (req: any, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    console.log(`Razorpay signature found on webhook header: ${signature}`);
    
    const eventProcessed = await processWebhookEvent(req.body);
    if (eventProcessed) {
      return res.status(200).json({ status: 'ok', message: 'Webhook registered successfully.' });
    }
    return res.status(400).json({ error: 'Unrecognized event type' });
  } catch (err: any) {
    console.error('Razorpay Webhook parsing error:', err);
    return res.status(500).json({ error: 'Internal server error processing webhook stream' });
  }
});

export default router;
