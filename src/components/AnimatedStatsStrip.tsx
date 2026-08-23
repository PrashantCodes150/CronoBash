"use client";

import React, { useEffect, useRef, useState } from 'react';

interface StatConfig {
  label: string;
  endValue: number;
  format: (v: number) => string;
  color: string;
}

const STATS: StatConfig[] = [
  {
    label: 'Live Focus Hours',
    endValue: 1.2,
    format: (v) => `${v.toFixed(1)}M+`,
    color: 'text-[#0a0a0a]',
  },
  {
    label: 'Active Squad Arenas',
    endValue: 8450,
    format: (v) => v.toLocaleString('en-IN'),
    color: 'text-[#0a0a0a]',
  },
  {
    label: 'TKN Earned Today',
    endValue: 450,
    format: (v) => `${Math.round(v)}K`,
    color: 'text-prompt-brown',
  },
];

function AnimatedNumber({ stat, index }: { stat: StatConfig; index: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const duration = 1800; // ms
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease-out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(eased * stat.endValue);
            if (progress < 1) requestAnimationFrame(tick);
            else setValue(stat.endValue);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.endValue]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center sm:items-start text-center sm:text-left ${
        index > 0 ? 'border-l border-surface-variant/80 pl-2 sm:pl-0 sm:border-l-0' : ''
      }`}
    >
      <p className="text-[10px] sm:text-[12px] font-semibold leading-[14px] sm:leading-[16px] tracking-[0.03em] sm:tracking-[0.08em] text-outline uppercase mb-0.5 sm:mb-1">
        {stat.label}
      </p>
      <p className={`text-xl sm:text-2xl md:text-[32px] leading-tight sm:leading-[40px] tracking-[-0.02em] font-medium ${stat.color}`}>
        {stat.format(value)}
      </p>
    </div>
  );
}

interface AnimatedStatsProps {
  stats?: { focusHours?: string; activeSquads?: string; cashWon?: string };
}

export default function AnimatedStatsStrip({}: AnimatedStatsProps) {
  return (
    <section className="w-full bg-surface border-y border-surface-variant py-5 sm:py-12 relative z-20">
      <div
        suppressHydrationWarning={true}
        className="max-w-[1200px] mx-auto px-3 sm:px-6 md:px-16 grid grid-cols-3 gap-1 sm:gap-8 items-center justify-between reveal"
      >
        {STATS.map((s, idx) => (
          <AnimatedNumber key={s.label} stat={s} index={idx} />
        ))}
      </div>
    </section>
  );
}
