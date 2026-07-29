"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth-context';
import { Megaphone, ChevronLeft, ChevronRight, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ✏️  EDIT YOUR ANNOUNCEMENTS HERE — change text/accent freely.
//     They auto-cycle every 5 seconds. Add or remove entries as you like.
// ─────────────────────────────────────────────────────────────────────────────
const ANNOUNCEMENTS: { id: number; text: string; accent: string }[] = [
  {
    id: 1,
    text: '🚀 Welcome to Focus Arena! Complete focus sprints to level up and unlock exclusive badges.',
    accent: '#3B82F6',
  },
  {
    id: 2,
    text: '🏆 New leaderboard season is live! Challenge squad members to 1v1 focus duels and climb the global ranks.',
    accent: '#F59E0B',
  },
  {
    id: 3,
    text: '🎨 Arena Marketplace coming soon — unlock custom room themes, ambient audio, and glowing avatar borders!',
    accent: '#9333EA',
  },
  {
    id: 4,
    text: '💡 Pro tip: Study in squad arenas to earn 2× XP and streak bonuses. Invite buddies from the Buddies tab!',
    accent: '#10B981',
  },
  {
    id: 5,
    text: '🔐 Wallet & token stakes launching soon — earn real rewards for hitting your daily focus goals.',
    accent: '#EF4444',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

function getGreetingParts(name?: string): { greeting: string; username: string } {
  const hour = new Date().getHours();
  const firstName = name?.trim() ? name.trim().split(' ')[0] : '';
  let greeting = '';
  if (hour >= 5 && hour < 12) greeting = firstName ? 'Good morning,' : 'Good morning!';
  else if (hour >= 12 && hour < 17) greeting = firstName ? 'Good afternoon,' : 'Good afternoon!';
  else if (hour >= 17 && hour < 21) greeting = firstName ? 'Good evening,' : 'Good evening!';
  else greeting = firstName ? 'Welcome back,' : 'Welcome back!';
  return { greeting, username: firstName };
}

function getEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 17) return '👋';
  if (hour >= 17 && hour < 21) return '🌆';
  return '🌙';
}

export default function GreetingBanner() {
  const { profile } = useAuth();
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Auto-cycle every 5 seconds
  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [dismissed]);

  const prev = () => setCurrent(p => (p - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  const next = () => setCurrent(p => (p + 1) % ANNOUNCEMENTS.length);

  const ann = ANNOUNCEMENTS[current];
  const { greeting, username } = getGreetingParts(profile?.name);
  const emoji = getEmoji();

  return (
    <div className="w-full space-y-3.5">

      {/* ── GREETING ROW — Syne font with electric orange username highlight ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-center gap-2.5 flex-wrap"
      >
        {/* Sharp greeting prefix */}
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#334155] tracking-tight leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {greeting}
        </h1>

        {/* Username */}
        {username && (
          <span
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight italic"
            style={{ fontFamily: "'Dancing Script', cursive", color: '#ff5500' }}
          >
            {username}
          </span>
        )}

        {/* Emoji */}
        <span className="text-2xl sm:text-3xl leading-tight">{emoji}</span>
      </motion.div>

      {/* ── ANNOUNCEMENT SLIDER ── */}
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="relative w-full bg-white border border-white/90 rounded-2xl shadow-sm overflow-hidden flex items-center gap-3 px-4 py-2.5 select-none"
          style={{ borderLeft: `3px solid ${ann.accent}` }}
        >
          {/* Icon */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: ann.accent }}
          >
            <Megaphone className="w-3.5 h-3.5" />
          </div>

          {/* Sliding Text */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-semibold text-slate-700 truncate"
              >
                {ann.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {ANNOUNCEMENTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer"
                style={{
                  backgroundColor: i === current ? ann.accent : '#E2E8F0',
                  transform: i === current ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prev}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button
              onClick={next}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </motion.div>
      )}

    </div>
  );
}
