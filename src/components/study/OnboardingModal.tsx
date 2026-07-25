"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!accepted) return;
    setLoading(true);

    try {
      // Attempt to save to Supabase User Profile. 
      // If the column does not exist or fails, we fall back to localStorage.
      const { error } = await supabase
        .from('users')
        .update({ has_seen_onboarding: true } as any)
        .eq('id', userId);
      
      if (error) {
        console.warn("Could not save onboarding status to database users table, using local storage fallback:", error.message);
      }
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
    } catch (err) {
      console.error("Error setting onboarding:", err);
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
    } finally {
      setLoading(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-neutral-800 bg-gradient-to-r from-emerald-950/20 to-neutral-900">
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/30">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>GAMIFIED PRODUCTIVITY</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white font-sans flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            Welcome to CronoBash Arena
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Rules, Fair Play policies, and camera focus requirements.
          </p>
        </div>

        {/* Scrollable Rules Container */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 text-sm leading-relaxed text-neutral-300">
          {/* Rule 1: FocusCam */}
          <div className="flex gap-4 p-3 rounded-lg bg-neutral-950 border border-neutral-800/40">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">FocusCam Monitoring</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Your webcam will be activated and analyzed in real-time. Make sure your face is visible, your eyes are on the screen, and your environment is sufficiently lit.
              </p>
            </div>
          </div>

          {/* Rule 2: Hand-Down Policy */}
          <div className="flex gap-4 p-3 rounded-lg bg-neutral-950 border border-neutral-800/40">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Hand-Down / Slump Policy</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Resting your head on your table or covering your face acts as a distraction trigger. If a distraction is detected:
                <span className="block mt-1 font-mono text-[11px] text-red-400">
                  ⚡ 3-Second Debounce → Emits Event → 5 Strikes = Automatic Room Elimination
                </span>
              </p>
            </div>
          </div>

          {/* Rule 3: Fair Play */}
          <div className="flex gap-4 p-3 rounded-lg bg-neutral-950 border border-neutral-800/40">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Zero Tolerance Cheating</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Pre-recorded loops, virtual camera feeds, or covering the camera sensor will be flagged by our AI detection filters. Cheating results in immediate entry-fee forfeiture.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Accept Checkbox */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900"
            />
            <span className="text-xs text-neutral-400">
              I agree to the rules, fair play terms, and hand-down strike policies.
            </span>
          </label>

          <button
            onClick={handleStart}
            disabled={!accepted || loading}
            className={`px-6 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all ${
              accepted && !loading
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-950/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Entering Room...' : 'Start Studying'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
