import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, fetchRazorpayPayment } from '@/lib/razorpay';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized. An authenticated user session token is required to verify payment.' },
        { status: 401 }
      );
    }

    // Verify caller identity with Supabase Auth
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !authUser?.id) {
      return NextResponse.json(
        { error: 'Invalid or expired user session token.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Verify HMAC-SHA256 Cryptographic Signature
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Cryptographic payment signature verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch Authoritative Payment Details directly from Razorpay API
    const paymentResult = await fetchRazorpayPayment(razorpay_payment_id);
    if (!paymentResult.success || !paymentResult.payment) {
      return NextResponse.json(
        { error: paymentResult.error || 'Unable to verify payment with payment gateway provider.' },
        { status: 400 }
      );
    }

    const rzpPayment = paymentResult.payment;

    // 3. Security Cross-Checks
    if (rzpPayment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Payment order ID mismatch. Verification rejected.' },
        { status: 400 }
      );
    }

    if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
      return NextResponse.json(
        { error: `Payment is not in a valid paid status (current status: ${rzpPayment.status}).` },
        { status: 400 }
      );
    }

    // Authoritative Amount in INR from Razorpay (converting paise to INR)
    const verifiedAmountINR = Math.round(rzpPayment.amount / 100);

    // 4. Idempotency Check: Prevent duplicate credit for the same payment reference
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('description', `Razorpay Payment Ref: ${razorpay_payment_id}`)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: 'Payment was already verified and fulfilled.',
        paymentId: razorpay_payment_id,
        amount: verifiedAmountINR,
      });
    }

    // 5. Securely Record Transaction and Credit User Balance
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { getSupabaseAdmin } = await import('@/lib/supabaseServer');
        const adminClient = getSupabaseAdmin();

        // Log transaction
        await adminClient.from('transactions').insert({
          user_id: authUser.id,
          type: 'deposit',
          amount: verifiedAmountINR,
          description: `Razorpay Payment Ref: ${razorpay_payment_id}`,
        });

        // Credit wallet balance
        const { data: wallet } = await adminClient
          .from('wallets')
          .select('id, balance')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (wallet) {
          await adminClient
            .from('wallets')
            .update({
              balance: Number(wallet.balance || 0) + verifiedAmountINR,
              updated_at: new Date().toISOString(),
            })
            .eq('id', wallet.id);
        } else {
          await adminClient.from('wallets').insert({
            user_id: authUser.id,
            balance: verifiedAmountINR,
          });
        }
      } else {
        // Fallback with authenticated client
        await supabase.from('transactions').insert({
          user_id: authUser.id,
          type: 'deposit',
          amount: verifiedAmountINR,
          description: `Razorpay Payment Ref: ${razorpay_payment_id}`,
        });
      }
    } catch (dbErr) {
      console.error('Database logging error during payment verification:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and transaction fulfilled successfully.',
      paymentId: razorpay_payment_id,
      amount: verifiedAmountINR,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error processing payment verification.' },
      { status: 500 }
    );
  }
}

