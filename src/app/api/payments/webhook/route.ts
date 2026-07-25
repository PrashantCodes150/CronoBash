import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay signature header.' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature({
      bodyText: rawBody,
      signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature verification failed.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Handle payment events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment Captured Successfully:', event.payload.payment.entity.id);
        break;
      case 'subscription.charged':
        console.log('Subscription Charged Successfully:', event.payload.subscription.entity.id);
        break;
      default:
        console.log('Unhandled Webhook Event:', event.event);
    }

    return NextResponse.json({ status: 'ok', event: event.event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error handling webhook.' }, { status: 500 });
  }
}
