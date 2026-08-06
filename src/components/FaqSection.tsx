"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';
import LottiePlayer from '@/components/LottiePlayer';

const FAQS = [
  {
    q: 'Is my webcam video private, and is any video data uploaded to servers?',
    a: 'No video data is ever uploaded or stored. CronoBash evaluates real-time focus 100% locally inside your browser using WebAssembly (WASM) computer vision models (MediaPipe). Your camera feed stays strictly on your device.',
  },
  {
    q: 'How does CronoBash calculate focus scores and handle paper studying?',
    a: 'Focus score telemetry monitors head pose, eye gaze, tab-switching frequency, and micro-movements. Paper Study Mode is natively supported — looking down at your desk to read books or write notes is recognized as 100% valid focus with zero penalties.',
  },
  {
    q: 'How do 1v1 High-Stakes Focus Duels and token escrow work?',
    a: 'You can challenge a rival to a 25m, 45m, or 60m focus sprint and commit optional TKN to escrow. Tokens are automatically locked in escrow during the session. Completing your sprint earns yield multipliers; abandoning or breaking flow forfeits the wager.',
  },
  {
    q: 'Are squad study rooms free to join for regular group study?',
    a: 'Yes, public squad arenas and private group study rooms are 100% free to access 24/7 for exam preparation, competitive coding, and group learning. Token wagers are completely optional.',
  },
  {
    q: 'How does the 100-Level progression system and badge unlocking work?',
    a: 'Every logged study minute awards XP scaled by your focus quality ratio. As you advance through levels 1 to 100 across Bronze, Silver, Gold, and Diamond tiers, 100 exclusive vector emblem badges automatically unlock in your profile.',
  },
  {
    q: 'What devices and web browsers are supported?',
    a: 'CronoBash runs smoothly on modern web browsers including Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, and Apple Safari across Windows, macOS, Linux, iOS, and Android without requiring any software installation.',
  },
];

// 9 Clearly Visible Gray Seagulls Positions Across FAQ Background
const SEAGULL_POSITIONS = [
  { top: '2%', left: '2%', size: 'w-48 h-48 sm:w-56 sm:h-56', opacity: 'opacity-70', rotate: '-rotate-12' },
  { top: '8%', right: '2%', size: 'w-52 h-52 sm:w-60 sm:h-60', opacity: 'opacity-75', rotate: 'rotate-6' },
  { top: '22%', left: '8%', size: 'w-44 h-44 sm:w-52 sm:h-52', opacity: 'opacity-65', rotate: 'rotate-12' },
  { top: '35%', right: '5%', size: 'w-40 h-40 sm:w-48 sm:h-48', opacity: 'opacity-70', rotate: '-rotate-6' },
  { top: '48%', left: '3%', size: 'w-52 h-52 sm:w-64 sm:h-64', opacity: 'opacity-75', rotate: 'rotate-3' },
  { top: '60%', right: '8%', size: 'w-44 h-44 sm:w-52 sm:h-52', opacity: 'opacity-65', rotate: '-rotate-15' },
  { top: '72%', left: '6%', size: 'w-40 h-40 sm:w-48 sm:h-48', opacity: 'opacity-70', rotate: 'rotate-8' },
  { top: '84%', right: '4%', size: 'w-52 h-52 sm:w-60 sm:h-60', opacity: 'opacity-75', rotate: '-rotate-8' },
  { top: '94%', left: '12%', size: 'w-44 h-44 sm:w-48 sm:h-48', opacity: 'opacity-65', rotate: 'rotate-15' },
];

export default function FaqSection() {
  return (
    <section id="faq" className="py-24 sm:py-32 w-full max-w-[1000px] mx-auto px-6 border-t border-surface-variant relative z-20 overflow-hidden">
      
      {/* ── BACKGROUND 9 CLEARLY VISIBLE GLIDING GRAY SEAGULLS (SPEED 0.25) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {SEAGULL_POSITIONS.map((pos, idx) => (
          <div
            key={idx}
            className={`absolute ${pos.size} ${pos.opacity} ${pos.rotate} filter contrast-150 brightness-75`}
            style={{ top: pos.top, left: pos.left, right: pos.right }}
          >
            <LottiePlayer
              src="/lottie/seagulls.json"
              speed={0.25}
              loop={true}
              autoplay={true}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div suppressHydrationWarning={true} className="mb-14 text-center reveal relative z-10">
        <h2 className="text-[clamp(32px,5vw,44px)] font-medium text-[#0a0a0a] tracking-[-0.03em] mb-4 font-sans">
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg text-on-surface-variant font-normal font-sans">
          Everything you need to know about CronoBash study rooms, WASM focus telemetry, and progression.
        </p>
      </div>

      {/* FAQ Accordion List — Matching Website UI/UX */}
      <div suppressHydrationWarning={true} className="space-y-4 reveal relative z-10">
        {FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group p-6 sm:p-7 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md shadow-xs transition-all duration-200 open:border-outline-variant/60"
          >
            <summary className="font-medium text-base sm:text-lg text-[#0a0a0a] cursor-pointer flex justify-between items-center list-none font-sans select-none gap-4">
              <span>{faq.q}</span>
              <ChevronDown className="w-5 h-5 text-prompt-brown group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-4 text-sm sm:text-base text-on-surface-variant leading-relaxed pt-4 border-t border-outline-variant/20 font-normal font-sans">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

    </section>
  );
}
