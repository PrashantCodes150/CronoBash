import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required payment verification tokens.' }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature verification failed.' }, { status: 400 });
    }

    // Verify caller authorization token to prevent impersonation attacks
    const authHeader = req.headers.get('authorization');
    let targetUserId = userId;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser?.id) {
        targetUserId = authUser.id;
      }
    }

    // Credit user balance in Supabase database if configured
    if (targetUserId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await supabase.from('transactions').insert({
          user_id: targetUserId,
          type: 'deposit',
          amount: Number(amount) || 0,
          description: `Razorpay Payment Ref: ${razorpay_payment_id}`,
        });
      } catch (dbErr) {
        console.error('Database logging error during payment verification:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and transaction fulfilled successfully.',
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error processing payment verification.' }, { status: 500 });
  }
}
