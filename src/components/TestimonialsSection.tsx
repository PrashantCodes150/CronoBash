"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sakshami Singh',
    role: 'Medical Aspirant (NEET)',
    quote: 'The squad rooms feel like a virtual study library where everyone is accountable. Being able to see live squad statuses keeps me in the zone for hours.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sakshami-singh',
    swingDuration: 3.6,
    swingAngle: 3.5,
  },
  {
    name: 'Prashant Singh',
    role: 'CS Undergrad & Competitive Programmer',
    quote: 'I went from struggling with 20-minute sessions to logging 4 hours of intense flow state daily. The focus score telemetry makes procrastination impossible.',
    avatar: '/prashant_singh.webp',
    swingDuration: 4.2,
    swingAngle: -3.8,
  },
  {
    name: 'Ravinder',
    role: 'Fintech Engineer & Scholar',
    quote: 'The XP curve and emblem badges make leveling up feel as rewarding as an RPG. Detailed analytics help me optimize my daily focus time.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ravinder',
    swingDuration: 3.9,
    swingAngle: 3.2,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 w-full max-w-[1200px] mx-auto px-6 md:px-16 border-t border-surface-variant relative z-20 overflow-hidden">
      
      {/* Section Header */}
      <div suppressHydrationWarning={true} className="max-w-2xl mb-16 reveal">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-prompt-brown font-sans flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-prompt-brown" />
          Community Feedback
        </span>
        <h2 className="text-[clamp(32px,5vw,48px)] font-medium text-[#0a0a0a] tracking-[-0.03em] leading-[1.08] mb-4 font-sans">
          Designed for focused study.
        </h2>
        <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed font-sans">
          See how students and professionals use CronoBash to build consistent focus habits.
        </p>
      </div>

      {/* Hanging Cards Container */}
      <div className="relative pt-10">
        
        {/* Top Horizontal Anchor Line */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-[2px] bg-outline-variant/40" />

        {/* Cards Grid with Floating Wind-Swinging Motion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="relative flex flex-col items-center">
              
              {/* Wind-Swinging Hanging Card & String Wrapper */}
              <motion.div
                initial={{ rotate: t.swingAngle, y: 0 }}
                animate={{
                  rotate: [-t.swingAngle, t.swingAngle, -t.swingAngle],
                  y: [0, -7, 0, 5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: t.swingDuration,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.03, rotate: 0, y: -4, transition: { duration: 0.2 } }}
                style={{ transformOrigin: 'top center' }}
                className="w-full flex flex-col items-center group cursor-pointer"
              >
                
                {/* Vertical Hanging String & Anchor Pins */}
                <div className="hidden md:flex flex-col items-center -mt-10 mb-0 z-10">
                  {/* Top Anchor Ring */}
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-prompt-brown bg-surface-container-lowest shadow-2xs group-hover:scale-110 transition-transform" />
                  {/* Vertical String Line */}
                  <div className="w-[2px] h-10 bg-gradient-to-b from-prompt-brown via-outline-variant/80 to-prompt-brown" />
                  {/* Clip Pin */}
                  <div className="w-2.5 h-2.5 rounded-full bg-prompt-brown -mt-1 shadow-2xs" />
                </div>

                {/* Card Container */}
                <div className="w-full h-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-xs group-hover:border-prompt-brown/50 group-hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-[#0a0a0a] leading-relaxed font-normal font-sans">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30 flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant/40 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <div className="text-sm font-semibold text-[#0a0a0a] font-sans group-hover:text-prompt-brown transition-colors">
                        {t.name}
                      </div>
                      <div className="text-xs text-on-surface-variant font-normal font-sans">{t.role}</div>
                    </div>
                  </div>
                </div>

              </motion.div>

            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
