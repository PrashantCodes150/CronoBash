"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Lock, Scale, ShieldAlert } from 'lucide-react';
import LottiePlayer from '@/components/LottiePlayer';

const MECHANIC_CARDS = [
  {
    id: 'rival',
    title: 'Challenge a Rival',
    tag: 'MATCHMAKING',
    desc: 'Matchmaking based on your target study sprint duration (25m / 45m / 60m) and focus accuracy.',
    Icon: Swords,
    delay: 0.1,
  },
  {
    id: 'stakes',
    title: 'Lock in the Stakes',
    tag: 'ESCROW',
    desc: 'Automated escrow holds tokens during live session. Web vision & tab telemetry verify flow state.',
    Icon: Lock,
    delay: 0.2,
  },
  {
    id: 'wager',
    title: 'Arena Wager Protocol',
    tag: 'WAGER YIELD',
    desc: 'Commit TKN to a focus session. Successfully complete it to earn yield or lose your stake if you abandon.',
    Icon: Scale,
    delay: 0.3,
  },
];

export default function DirectCashStakesSection() {
  return (
    <section id="stakes" className="py-20 sm:py-28 w-full max-w-[1200px] mx-auto px-6 md:px-16 border-t border-surface-variant relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

        {/* ── LEFT COLUMN: Headline & Animated Mechanic Cards ── */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-[clamp(32px,5vw,50px)] font-medium text-[#0a0a0a] tracking-[-0.03em] leading-[1.08] font-sans">
              High-Stakes Focus Duels.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed font-sans">
              Put your TKN on the line. Challenge peers to 1v1 focus sprints. The first to break flow loses their wager. It&apos;s the ultimate accountability mechanism.
            </p>
          </motion.div>

          {/* Animated Feature Cards */}
          <div className="space-y-4 pt-1">
            {MECHANIC_CARDS.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: card.delay }}
                whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                className="bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-xs hover:border-prompt-brown/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-[#0a0a0a] shrink-0 mt-0.5 group-hover:bg-prompt-brown/10 group-hover:text-prompt-brown transition-all duration-200">
                  <card.Icon className="w-5 h-5 text-prompt-brown group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base sm:text-lg font-medium text-[#0a0a0a] font-sans group-hover:text-prompt-brown transition-colors">
                      {card.title}
                    </h4>
                    <span className="text-[10px] font-semibold tracking-wider text-outline uppercase font-sans bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/20 group-hover:border-prompt-brown/30 transition-colors">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant font-normal leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

        {/* ── RIGHT COLUMN: Un-boxed Direct Meditation Lottie Animation ── */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full aspect-square max-w-[440px] flex items-center justify-center p-2"
          >
            {/* Ambient Soft Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-prompt-brown/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Direct Meditation Lottie Player (No Enclosing Card Box/Border) */}
            <LottiePlayer
              src="/lottie/meditation.json"
              className="w-full h-full object-contain pointer-events-none relative z-10"
              loop={true}
              autoplay={true}
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
