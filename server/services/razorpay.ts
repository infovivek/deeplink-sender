import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpay: Razorpay | null = null;

// Initialize Razorpay only if credentials are available
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amount: number; // in INR
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 500,
    amount: 199,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 2000,
    amount: 699,
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    credits: 5000,
    amount: 1499,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 10000,
    amount: 2499,
  },
];

export class RazorpayService {
  static async createOrder(packId: string, userId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    pack: CreditPack;
  }> {
    if (!razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      throw new Error('Invalid pack ID');
    }

    const order = await razorpay.orders.create({
      amount: pack.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `credit_${userId}_${Date.now()}`,
      notes: {
        userId,
        packId,
        credits: pack.credits.toString(),
      },
    });

    return {
      orderId: order.id,
      amount: pack.amount,
      currency: 'INR',
      pack,
    };
  }

  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  static async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  static getCreditPacks(): CreditPack[] {
    return CREDIT_PACKS;
  }

  static getCreditPack(packId: string): CreditPack | undefined {
    return CREDIT_PACKS.find(p => p.id === packId);
  }
}
