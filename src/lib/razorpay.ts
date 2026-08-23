import crypto from 'crypto';

export interface CreateOrderParams {
  amountInINR: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * Server-Side Razorpay Order Creation Helper
 * Calls Razorpay Orders API via HTTP Basic Auth using Node crypto/fetch
 */
export async function createRazorpayOrder({
  amountInINR,
  currency = 'INR',
  receipt,
  notes = {},
}: CreateOrderParams): Promise<{ success: boolean; order?: RazorpayOrder; error?: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: 'Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in environment variables.',
    };
  }

  const amountInPaise = Math.round(amountInINR * 100);

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.description || `Razorpay order creation failed with status ${response.status}`,
      };
    }

    const order: RazorpayOrder = await response.json();
    return { success: true, order };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during Razorpay order creation' };
  }
}

/**
 * Verifies Razorpay Payment Signature (HMAC-SHA256)
 * razorpay_signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Verifies Razorpay Webhook Event Signature
 */
export function verifyRazorpayWebhookSignature({
  bodyText,
  signature,
}: {
  bodyText: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyText)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Server-Side Razorpay Payment Details Fetcher
 * Queries Razorpay API directly to retrieve the authenticated payment object.
 * Prevents client-side amount tampering.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<{
  success: boolean;
  payment?: {
    id: string;
    order_id: string;
    status: string;
    amount: number; // In paise (e.g. 1000 = ₹10.00)
    currency: string;
    email?: string;
    contact?: string;
  };
  error?: string;
}> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: 'Razorpay API credentials are not configured.',
    };
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error?.description || `Failed to fetch payment details with status ${response.status}`,
      };
    }

    const payment = await response.json();
    return { success: true, payment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error fetching Razorpay payment details' };
  }
}

