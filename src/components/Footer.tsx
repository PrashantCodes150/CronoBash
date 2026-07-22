"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Scale, Lock, RefreshCw, Mail, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-900 text-neutral-400 font-mono text-xs py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Skill Gaming Notice */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-lg text-white tracking-tight">FOCUS ARENA</span>
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded font-bold">
              100% GAME OF SKILL
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 max-w-md">
            Productivity esports platform. Match outcomes are strictly determined by human focus & cognitive discipline verified by MediaPipe AI.
          </p>
        </div>

        {/* Legal Links & 18+ Badge */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
          <Link href="/terms" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refund Policy
          </Link>
          
          <div className="flex items-center gap-1 bg-red-950/60 border border-red-800/60 text-red-400 px-2.5 py-1 rounded-full font-bold text-[10px]">
            <Award className="w-3.5 h-3.5 text-red-400" />
            18+ ONLY FOR CASH MATCHES
          </div>
        </div>

        {/* Contact Email */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Mail className="w-3.5 h-3.5 text-neutral-400" />
          <span>support@focusarena.com</span>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-neutral-900/80 mt-6 pt-4 text-center text-[10px] text-neutral-600">
        © 2026 Focus Arena (CogniSweep). All rights reserved. Restricted states: Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, Sikkim.
      </div>
    </footer>
  );
}

export default Footer;
