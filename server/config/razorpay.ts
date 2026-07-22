import Razorpay from 'razorpay';
import { ENV } from './env';

let razorpayClient: any = null;

export function getRazorpay() {
  if (!razorpayClient) {
    const rawKeyId = ENV.RAZORPAY_KEY_ID;
    const rawKeySecret = ENV.RAZORPAY_KEY_SECRET;
    
    if (!rawKeyId || !rawKeySecret || rawKeyId.trim() === '' || rawKeySecret.trim() === '') {
      console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in the environment. Falling back to simulated/mock payments.');
      return null;
    }
    
    const keyId = rawKeyId.trim();
    const keySecret = rawKeySecret.trim();
    try {
      razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      console.log('Razorpay SDK client successfully initialized server-side with key: ' + keyId);
    } catch (e) {
      console.error('Failed to initialize Razorpay SDK:', e);
    }
  }
  return razorpayClient;
}
