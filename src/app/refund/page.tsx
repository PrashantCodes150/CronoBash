"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans antialiased">
      
      {/* Main 2-Column Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Left Sticky Sidebar (Table of Contents) */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-8 space-y-4 text-xs font-mono border-l border-zinc-800 pl-4">
            <div className="pb-2 border-b border-zinc-800/80">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-white transition font-mono font-bold">
                <ArrowLeft className="w-4 h-4" /> Back to Application
              </Link>
            </div>
            <p className="font-bold text-white tracking-widest uppercase text-[11px]">Table of Contents</p>
            <nav className="space-y-2.5 text-zinc-400">
              <a href="#section-1" className="block hover:text-emerald-400 transition">1. Non-Monetary Tokens</a>
              <a href="#section-2" className="block hover:text-emerald-400 transition">2. Strict No-Refund Policy</a>
              <a href="#section-3" className="block hover:text-emerald-400 transition">3. Payment Gateway Errors</a>
              <a href="#section-4" className="block hover:text-emerald-400 transition">4. Grievance Redressal</a>
            </nav>
            <div className="pt-4 border-t border-zinc-800/80">
              <Link href="/terms" className="text-emerald-400 hover:underline block text-[11px]">
                ← Terms of Service
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Area (Dense Wall of Text) */}
        <main className="flex-1 space-y-10 text-[14px] leading-relaxed text-zinc-300">
          
          {/* Document Header */}
          <div className="border-b border-zinc-800 pb-6 space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-zinc-400 text-xs font-mono">
              Governed under Consumer Protection (E-Commerce) Rules, 2020 &amp; Reserve Bank of India (RBI) Payment Settlement Frameworks.
            </p>
          </div>

          {/* Section 1 */}
          <section id="section-1" className="space-y-3 pt-2 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              1. Non-Monetary Virtual Tokens &amp; Free Services
            </h2>
            <p>
              Virtual focus tokens, streak points, and study counters earned or displayed on the Platform are non-transferable, non-monetary virtual counters designed strictly for user discipline tracking. They carry ZERO real-world cash value, cannot be redeemed for fiat currency, real assets, or rewards, and do not constitute bank deposits, financial assets, or wager balances under online gaming or gambling regulations.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="space-y-3 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              2. Strict No-Refund Policy &amp; Error Waiver
            </h2>
            <p>
              All transactions, paid features, subscriptions, digital passes, and optional utility purchases made on CronoBash are final, non-cancellable, and strictly non-refundable. By completing a transaction on the Platform, you expressly waive any right to a refund, chargeback, or financial credit under any circumstances, to the maximum extent permitted by applicable law.
            </p>
            <p>
              Zero Liability for Technical or User Errors: Refunds, token replacements, or financial adjustments will NOT be issued for user errors, accidental purchases, buyer&apos;s remorse, local internet disconnections, device hardware failures, browser incompatibilities, or temporary platform downtime, server latency, or software errors occurring during a study sprint.
            </p>
            <p>
              Forfeiture Upon Account Termination: If your account is suspended, restricted, or permanently terminated by Platform Operators due to a violation of the Terms of Service, copyright infringement, or security protocols, all active digital passes and access rights are immediately forfeited without obligation for pecuniary restitution.
            </p>
          </section>

          {/* Section 3: CORRECTED TO PREVENT CONTRA PROFERENTEM CONTRADICTION */}
          <section id="section-3" className="space-y-3 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              3. Payment Gateway Discrepancies &amp; Duplicate Transactions
            </h2>
            <p>
              CronoBash does not issue refunds for platform features, server downtime, or user-side errors. Section 3 applies STRICTLY AND EXCLUSIVELY to duplicate billing charges or payment gateway errors occurring at the banking infrastructure level.
            </p>
            <p>
              If your bank account, UPI ID, or credit card is debited multiple times for a single transaction due to a network timeout between your bank and the payment gateway:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>Submit a written discrepancy notice to <a href="mailto:cronobash@gmail.com" className="text-emerald-400 underline font-semibold">cronobash@gmail.com</a> within 7 days of the transaction date.</li>
              <li>Include your registered account email, official payment gateway reference/UTR ID, and bank debit proof.</li>
              <li>Verified duplicate transactions (where double payment was debited for a single digital delivery) will be reconciled or reversed to the original payment source within 5 to 7 business days, in compliance with Reserve Bank of India (RBI) payment settlement frameworks.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="space-y-3 pt-4 scroll-mt-28">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wider border-b border-zinc-800/60 pb-2">
              4. Support &amp; Statutory Grievance Redressal
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, any user grievances, billing inquiries, or regulatory notices must be directed to our designated digital compliance desk:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-mono">
              <p><strong className="text-white">Designation:</strong> Grievance &amp; Legal Compliance Officer, CronoBash Platform</p>
              <p><strong className="text-white">Official Grievance Email:</strong> <a href="mailto:cronobash@gmail.com" className="text-emerald-400 underline font-bold">cronobash@gmail.com</a></p>
              <p><strong className="text-white">Legal &amp; Copyright Desk:</strong> <a href="mailto:cronobash@gmail.com" className="text-emerald-400 underline font-bold">cronobash@gmail.com</a></p>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              All formal communications must be sent via email. We commit to acknowledging digital grievance emails within 48 business hours and resolving legitimate issues within statutory timelines prescribed under Indian law.
            </p>
          </section>

        </main>
      </div>

    </div>
  );
}
