import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, planType } = body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 100000) {
      return NextResponse.json(
        { error: 'Invalid payment amount specified. Amount must be between ₹1 and ₹100,000.' },
        { status: 400 }
      );
    }

    // Optional caller token verification
    let callerId = 'anonymous';
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.id) {
        callerId = user.id;
      }
    }

    // Call server-side Razorpay order creation helper
    const result = await createRazorpayOrder({
      amountInINR: parsedAmount,
      currency: 'INR',
      notes: {
        userId: callerId,
        planType: String(planType || 'wallet_topup').slice(0, 50),
      },
    });

    if (!result.success || !result.order) {
      return NextResponse.json(
        { error: result.error || 'Failed to create payment order.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      amount: result.order.amount,
      currency: result.order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error processing payment order.' },
      { status: 500 }
    );
  }
}

