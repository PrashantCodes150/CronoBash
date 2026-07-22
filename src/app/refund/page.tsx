"use client";

import React from 'react';
import Link from 'next/link';
import { RefreshCw, CreditCard, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <RefreshCw className="w-4 h-4" />
          PAYMENTS & REFUNDS
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Refund & Cancellation Policy</h1>
        <p className="text-xs text-neutral-400 font-mono">Last Updated: July 2026</p>
      </header>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-amber-400 pl-3">1. Wallet Deposit Refunds</h2>
        <p>
          Unused funds deposited into your Focus Arena wallet can be withdrawn to your verified UPI ID or Bank Account at any time via the Wallet page. Approved withdrawal requests are processed within 24 to 48 hours.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-amber-400 pl-3">2. Match Entry Fee Cancellation</h2>
        <p>
          If a money room is cancelled before the match countdown begins, entry fees are 100% refunded to all contestants' wallets automatically. Once a match begins, entry fees are locked into the match escrow pool and cannot be cancelled.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-red-500 pl-3 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          3. Technical Disconnections & System Outages
        </h2>
        <p>
          In the rare event of a verified global server outage during a cash match, all contestants will receive a 100% refund of their entry fees. Player-side internet drops or voluntary exits do not qualify for refunds and are governed by forfeiture rules.
        </p>
      </section>

      <footer className="pt-8 border-t border-neutral-900 flex justify-between items-center text-xs font-mono text-neutral-500">
        <Link href="/" className="text-amber-400 hover:underline font-bold">← Back to Focus Arena</Link>
        <span>Support: billing@focusarena.com</span>
      </footer>
    </div>
  );
}
