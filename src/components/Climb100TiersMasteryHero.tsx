"use client";

import React from 'react';
import { motion } from 'framer-motion';
import LottiePlayer from '@/components/LottiePlayer';
import { BADGES } from '@/lib/badges';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';

const TIERS = [
  {
    badgeObj: BADGES[0], // Level 1: Noob Starter 🔰
    title: 'Bronze Scholar',
    level: 'LEVEL 1 - 25',
    badgeLabel: 'Noob Starter 🔰',
    desc: 'The foundation of focus. Access to basic squads, analytics, and Level 1-25 badges.',
    delay: 0.1,
  },
  {
    badgeObj: BADGES[49], // Level 50: Obsidian Shield 🛡️
    title: 'Silver Strategist',
    level: 'LEVEL 26 - 50',
    badgeLabel: 'Obsidian Shield 🛡️',
    desc: 'Refined routines. Unlocks advanced analytics, duel matchmaking, and Level 26-50 badges.',
    delay: 0.2,
  },
  {
    badgeObj: BADGES[74], // Level 75: Synapse Emperor 👑
    title: 'Gold Focus Master',
    level: 'LEVEL 51 - 75',
    badgeLabel: 'Synapse Emperor 👑',
    desc: 'Elite cognitive endurance. Custom arena cosmetics and Level 51-75 badges unlocked.',
    delay: 0.3,
  },
  {
    badgeObj: BADGES[99], // Level 100: Supreme Arena Overlord 👑
    title: 'Diamond Scholar',
    level: 'LEVEL 76 - 100',
    badgeLabel: 'Supreme Overlord 👑',
    desc: 'Absolute mastery. Highest yield multipliers, exclusive leaderboards, and Level 100 crown badge.',
    delay: 0.4,
  },
];

export default function Climb100TiersMasteryHero() {
  return (
    <section id="levels" className="py-20 sm:py-28 w-full max-w-[1200px] mx-auto px-6 md:px-16 relative z-20">

      {/* Header — Thick Title & Boxer Lottie Animation On The Same Plane */}
      <div suppressHydrationWarning={true} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-surface-variant/40 pb-4 sm:pb-6 reveal">
        
        <div className="max-w-2xl space-y-2">
          <h2
            className="text-[clamp(32px,4.5vw,50px)] font-black text-[#0a0a0a] tracking-tight leading-[1.04] font-sans drop-shadow-xs"
            style={{ fontWeight: 900 }}
          >
            Progressive Mastery Tiers
          </h2>
          <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed font-sans">
            Climb the ranks through consistent, uninterrupted deep work. Each tier unlocks new arena aesthetics and higher base token yields.
          </p>
        </div>

        {/* Boxer Lottie Animation on the Same Plane */}
        <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center shrink-0 self-start md:self-center -my-4">
          <LottiePlayer
            src="/lottie/boxer.json"
            className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
            loop={true}
            autoplay={true}
          />
        </div>

      </div>

      {/* Animated Tier Cards with True Website SVG Vector Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {TIERS.map((t) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: t.delay }}
            whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center text-center border border-outline-variant/30 hover:border-prompt-brown/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden group cursor-pointer"
          >
            {/* True Website Badge SVG Display */}
            <div className="mb-4 relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <BadgeDisplay badge={t.badgeObj} size="md" isUnlocked={true} />
            </div>
            
            <h4 className="text-[20px] leading-[28px] font-medium text-[#0a0a0a] mb-1 relative z-10 font-sans group-hover:text-prompt-brown transition-colors">
              {t.title}
            </h4>
            
            <p className="text-[12px] font-semibold tracking-[0.05em] text-outline mb-3 uppercase relative z-10 font-sans">
              {t.level}
            </p>

            {/* True Website Badge Label */}
            <span className="text-[11px] font-semibold text-prompt-brown mb-4 font-sans bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/20 group-hover:border-prompt-brown/30 relative z-10 transition-colors">
              {t.badgeLabel}
            </span>

            <p className="text-[15px] leading-[22px] text-on-surface-variant text-sm font-normal relative z-10 font-sans">
              {t.desc}
            </p>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
