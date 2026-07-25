import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, planType, userId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount specified.' }, { status: 400 });
    }

    // Call server-side Razorpay order creation helper
    const result = await createRazorpayOrder({
      amountInINR: Number(amount),
      currency: 'INR',
      notes: {
        userId: userId || 'anonymous',
        planType: planType || 'wallet_topup',
      },
    });

    if (!result.success || !result.order) {
      return NextResponse.json({ error: result.error || 'Failed to create payment order.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      amount: result.order.amount,
      currency: result.order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error processing payment order.' }, { status: 500 });
  }
}
