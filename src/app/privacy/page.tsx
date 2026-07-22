"use client";

import React from 'react';
import Link from 'next/link';
import { Lock, EyeOff, ShieldCheck, Cpu } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          DATA PRIVACY & CAMERA PROTECTION
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Privacy Policy & Video Stream Security</h1>
        <p className="text-xs text-neutral-400 font-mono">DPDP Act 2023 & GDPR Compliant • Last Updated: July 2026</p>
      </header>

      {/* Camera Privacy Highlights */}
      <div className="bg-neutral-900 border border-cyan-500/30 p-5 rounded-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <EyeOff className="w-5 h-5 text-cyan-400" />
          LOCAL ON-DEVICE CAMERA SCANNING (NO SERVER RECORDING)
        </div>
        <p className="text-neutral-300 leading-relaxed">
          Your webcam stream is analyzed strictly in real time inside your own browser using <strong>MediaPipe WASM AI models</strong>. We do <strong>NOT</strong> record, store, transmit, or save your camera video or biometric face data on any server.
        </p>
      </div>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-cyan-400 pl-3">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2 text-neutral-400">
          <li><strong>Account Data:</strong> Name, Email Address, and Avatar URL provided during signup.</li>
          <li><strong>Focus Telemetry:</strong> Anonymized numerical focus index scores, session duration, and distraction strike counts.</li>
          <li><strong>Financial Ledger:</strong> Wallet deposit/withdrawal transaction records and match prize pool history.</li>
        </ul>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-cyan-400 pl-3">2. WebRTC Peer-to-Peer Camera Streaming</h2>
        <p>
          Video sharing in live study arenas operates via encrypted <strong>WebRTC peer-to-peer streams</strong> directly between connected contestants. Video feeds are transient and disappear immediately when a room is closed.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-cyan-400 pl-3">3. Data Protection Rights (DPDP & GDPR)</h2>
        <p>
          You retain full rights to request account deletion, export your session data, or modify your profile at any time. For privacy inquiries, contact our Data Protection Officer at <span className="text-cyan-400">privacy@focusarena.com</span>.
        </p>
      </section>

      <footer className="pt-8 border-t border-neutral-900 flex justify-between items-center text-xs font-mono text-neutral-500">
        <Link href="/" className="text-cyan-400 hover:underline font-bold">← Back to Focus Arena</Link>
        <span>© 2026 Focus Arena. All Rights Reserved.</span>
      </footer>
    </div>
  );
}
