"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-neutral-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          LEGAL & COMPLIANCE
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Terms of Service & Skill Gaming Policy</h1>
        <p className="text-xs text-neutral-400 font-mono">Last Updated: July 2026 • Effective Immediately</p>
      </header>

      {/* Highlights Summary Box */}
      <div className="bg-neutral-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          GAME OF SKILL LEGAL CLASSIFICATION
        </div>
        <p className="text-neutral-300 leading-relaxed">
          Focus Arena (CogniSweep) is a 100% Game of Skill platform. Match outcomes are determined purely by human mental focus, gaze retention, and cognitive discipline evaluated by AI camera sensors. No chance or random luck is involved.
        </p>
      </div>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-emerald-400 pl-3">1. Age & Eligibility Restrictions</h2>
        <p>
          Participation in free study rooms is open to all ages. However, entry into real-money stakes matches is strictly restricted to individuals who are <strong>18 years of age or older</strong>. By entering any money match, you confirm under penalty of perjury that you meet this age requirement.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-red-500 pl-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          2. Restricted Indian States (Territorial Prohibition)
        </h2>
        <p>
          In accordance with state gaming laws, residents of the following Indian states are strictly prohibited from participating in real-money contests on Focus Arena:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
          {['Assam', 'Odisha', 'Telangana', 'Andhra Pradesh', 'Nagaland', 'Sikkim'].map((state) => (
            <div key={state} className="bg-red-950/40 border border-red-800/50 p-2 rounded-xl text-center text-red-400 font-bold">
              🚫 {state}
            </div>
          ))}
        </div>
        <p className="text-neutral-400 text-[11px]">
          Users from these states may freely participate in all free public rooms, private study groups, and leaderboards.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-emerald-400 pl-3">3. Match Settlement & Forfeiture Rules</h2>
        <p>
          Matches are timed study duels. If a contestant voluntarily leaves, reloads the page, closes their browser, or forfeits mid-match, they will be declared the <strong>LOSER</strong> immediately, and entry stakes will be awarded to the remaining contestant minus the platform commission fee.
        </p>
      </section>

      <section className="space-y-4 font-mono text-xs text-neutral-300 leading-relaxed">
        <h2 className="text-lg font-bold text-white uppercase font-sans border-l-4 border-emerald-400 pl-3">4. Anti-Cheat & Fair Play Policy</h2>
        <p>
          We employ AI static frame verification, micro-movement checks, and gaze alignment algorithms. Using virtual webcams, pre-recorded videos, static photo prints, or automated bot tools constitutes fraud and will result in instant account ban and balance forfeiture.
        </p>
      </section>

      <footer className="pt-8 border-t border-neutral-900 flex justify-between items-center text-xs font-mono text-neutral-500">
        <Link href="/" className="text-emerald-400 hover:underline font-bold">← Back to Focus Arena</Link>
        <span>© 2026 Focus Arena. All Rights Reserved.</span>
      </footer>
    </div>
  );
}
