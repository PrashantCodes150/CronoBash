"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { ShieldCheck, Lock, ArrowLeft, Coins, Sparkles, CreditCard, CheckCircle, Zap } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const { wallet, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ amount: number; tokens: number; title: string }>({
    amount: 199,
    tokens: 200,
    title: 'Starter Token Pass',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Call production order creation API route
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          planType: selectedPlan.title,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.error || 'Razorpay environment credentials unconfigured. Add RAZORPAY_KEY_ID to .env.local',
        });
        setLoading(false);
        return;
      }

      // Load Razorpay Checkout JS SDK if available
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CronoBash Platform',
        description: selectedPlan.title,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment signature on backend
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user?.id,
              amount: selectedPlan.amount,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setMessage({ type: 'success', text: `Payment verified! Ref: ${response.razorpay_payment_id}` });
          }
        },
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#00FFA3',
        },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setMessage({ type: 'success', text: `Order created: ${data.orderId}. Connect Razorpay SDK in prod.` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Payment initiation error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-8 px-4 select-none relative overflow-y-auto max-w-4xl mx-auto flex flex-col items-center justify-center">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Full-Page Center Card */}
      <div className="w-full max-w-2xl bg-surface-container border border-outline-variant/40 rounded-3xl p-6 sm:p-10 md:p-12 text-center space-y-6 md:space-y-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Top Header Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Coins className="w-7 h-7" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            PRODUCTION PAYMENT GATEWAY
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight">
            Wallet Balance &amp; Token Recharge
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-mono max-w-md mx-auto leading-relaxed">
            Purchase study arena entry tokens and CronoPass subscriptions using Razorpay UPI, Netbanking, or Credit Cards.
          </p>
        </div>

        {/* Current Balance & Plan Selector */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-4 text-left font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Current Wallet Balance:
            </span>
            <span className="text-white font-bold text-sm">{wallet?.balance ?? 0} Tokens</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { amount: 99, tokens: 100, title: 'Mini Token Pass' },
              { amount: 199, tokens: 250, title: 'Pro Token Pass' },
              { amount: 499, tokens: 700, title: 'Master Token Pass' },
            ].map((plan) => (
              <button
                key={plan.amount}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedPlan.amount === plan.amount
                    ? 'border-emerald-400 bg-emerald-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[11px] font-bold">{plan.title}</span>
                  {selectedPlan.amount === plan.amount && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="mt-2">
                  <span className="text-lg font-black text-white">₹{plan.amount}</span>
                  <span className="text-[10px] text-neutral-400 block">{plan.tokens} Tokens</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Notification Message */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-mono text-left border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* High-Trust Positive Verification Guarantee */}
        <div className="bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl p-4 text-left space-y-1.5 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified Razorpay Escrow Architecture</span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-mono leading-relaxed">
            Transactions are processed via Razorpay API endpoints with HMAC-SHA256 signature verification and PostgreSQL <span className="text-white font-bold">SECURITY DEFINER</span> database ledgers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handleRazorpayPayment}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-mono text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Initiating Razorpay...' : `Pay ₹${selectedPlan.amount} via Razorpay`}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center justify-center gap-2 bg-surface-variant hover:bg-surface-bright border border-outline-variant text-white font-mono text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
