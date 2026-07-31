"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedStatsProps {
  stats: {
    focusHours: string;
    activeSquads: string;
    cashWon: string;
  };
}

function CounterNumber({ endVal, prefix = '', suffix = '' }: { endVal: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setVal(0);
      return;
    }

    let start = 0;
    const duration = 1800; // 1.8 seconds count up
    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(easeProgress * endVal);
      
      setVal(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setVal(endVal);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [isInView, endVal]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function AnimatedStatsStrip({ stats }: AnimatedStatsProps) {
  return (
    <section id="stats" className="py-16 border-y border-slate-200/60 bg-white/50 backdrop-blur-md relative z-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/70">
          
          {/* Stat 1: Live Focus Hours Logged */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="py-4 md:py-0 flex flex-col items-center justify-center group"
          >
            <div
              className="text-[38px] sm:text-[48px] md:text-[56px] font-extrabold text-[#334155] tracking-tight group-hover:text-[#FF5500] transition-colors"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <CounterNumber endVal={1420} suffix=" hrs" />
            </div>
            <div className="text-xs font-mono font-bold text-[#44474c] uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              Live Focus Hours Logged
            </div>
          </motion.div>

          {/* Stat 2: Active Squad Arenas */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="py-4 md:py-0 flex flex-col items-center justify-center group"
          >
            <div
              className="text-[38px] sm:text-[48px] md:text-[56px] font-extrabold text-[#334155] tracking-tight group-hover:text-[#FF5500] transition-colors"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <CounterNumber endVal={24} suffix=" Active" />
            </div>
            <div className="text-xs font-mono font-bold text-[#44474c] uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              Active Squad Arenas
            </div>
          </motion.div>

          {/* Stat 3: Won in Cash Duels */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="py-4 md:py-0 flex flex-col items-center justify-center group"
          >
            <div
              className="text-[38px] sm:text-[48px] md:text-[56px] font-extrabold text-[#334155] tracking-tight group-hover:text-[#FF5500] transition-colors"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <CounterNumber endVal={1000} prefix="₹" suffix="+" />
            </div>
            <div className="text-xs font-mono font-bold text-[#44474c] uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              Won in Cash Duels
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
