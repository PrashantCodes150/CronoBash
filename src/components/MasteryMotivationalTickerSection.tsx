"use client";

import React from 'react';

const highlights = [
  {
    label: 'MILESTONE 01',
    title: 'Progressive Tier System',
    desc: 'Unlock Bronze, Silver, Gold, and Diamond badges as you log verified focus hours and complete sprints.',
  },
  {
    label: 'MILESTONE 02',
    title: 'Verifiable XP Formula',
    desc: 'XP scales dynamically based on continuous session duration and real-time focus telemetry score.',
  },
  {
    label: 'MILESTONE 03',
    title: 'Study Milestones & Proof',
    desc: 'Generate shareable session cards and PDF certificates to track and prove your academic progress.',
  },
];

export default function MasteryMotivationalTickerSection() {
  return (
    <section className="py-8 sm:py-10 border-y border-slate-200/80 bg-white relative z-20 select-none">
      <div className="max-w-[1360px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((h, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 space-y-2">
              <span className="text-[10px] font-semibold text-crono-muted font-sans uppercase tracking-[0.08em]">{h.label}</span>
              <h4 className="text-base font-semibold text-crono-text font-sans">{h.title}</h4>
              <p className="text-xs text-crono-muted leading-relaxed font-normal font-sans">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
