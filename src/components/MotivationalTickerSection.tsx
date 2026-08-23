"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2 } from 'lucide-react';
import LottiePlayer from '@/components/LottiePlayer';

const PILLARS = [
  {
    id: '01',
    lottieSrc: '/lottie/deadline-loading.json',
    lottieScale: 'scale-100',
    title: 'Structured Cognitive Sprints',
    tagline: 'Science-backed 25m / 45m / 60m intervals engineered for peak flow without burnout.',
    detail: 'Automated work-rest cycles calibrate cognitive load, keeping your focus sharp across intense study sessions.',
    stat: '25m / 45m / 60m Sprints',
  },
  {
    id: '02',
    lottieSrc: '/lottie/eye-searching.json',
    lottieScale: 'scale-100',
    title: 'AI Distraction Telemetry',
    tagline: 'Live webcam vision & tab telemetry tracking presence, gaze, and real-time focus accuracy.',
    detail: 'Sub-second computer vision detects tab switches and head direction, logging a live focus score.',
    stat: '< 0.5s Latency Score',
  },
  {
    id: '03',
    lottieSrc: '/lottie/generations.json',
    lottieScale: 'scale-100',
    title: 'Squad Accountability Arenas',
    tagline: 'Live peer study rooms with synchronized timers, visual presence, and optional stake duels.',
    detail: 'Enter 24/7 public libraries or private squad rooms where visible peer activity keeps you locked in.',
    stat: '24/7 Live Squad Arenas',
  },
  {
    id: '04',
    lottieSrc: '/lottie/astronaut-award.json',
    lottieScale: 'scale-[2.4]', // Larger animation inside the same 48px box
    title: 'Verifiable XP & Level Tiers',
    tagline: 'Editorial-grade reporting, weekly focus analytics, and rank progression from Level 1 to 100.',
    detail: 'Every logged minute earns XP scaled by focus quality. Unlock prestige emblem badges as you advance.',
    stat: 'Level 1 – 100 Prestige',
  },
];

export default function MotivationalTickerSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const cards = cardsRef.current.filter(Boolean);
      if (!cards.length || !sectionRef.current) return;

      // Pin main section for smooth desktop scroll space
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          start: 'top top',
          end: '+=2400',
          scrub: 1,
        },
      });

      // Position cards 2, 3, 4 below initially
      cards.forEach((card, i) => {
        if (i > 0) {
          gsap.set(card, { yPercent: 100, opacity: 0 });
        }
      });

      // Animate card 2, 3, 4 up sequentially on scroll scrub
      cards.forEach((card, i) => {
        if (i === 0) return;
        tl.to(
          cards[i - 1],
          { scale: 0.96, opacity: 0.2, duration: 0.8, ease: 'power2.inOut' },
          `step-${i}`
        ).to(
          card,
          { yPercent: 0, opacity: 1, duration: 1, ease: 'power2.out' },
          `step-${i}`
        );
      });
    });

    mm.add("(max-width: 1023px)", () => {
      // Mobile: Render cards in natural flow without clipping
      const cards = cardsRef.current.filter(Boolean);
      cards.forEach((card) => {
        gsap.set(card, { yPercent: 0, opacity: 1, scale: 1 });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div id="features" ref={sectionRef} className="relative w-full py-16 sm:py-20 lg:py-0 lg:h-screen bg-surface border-t border-surface-variant flex items-center overflow-hidden z-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* ── LEFT COLUMN: Clear Punchy Heading + Description + Main Lottie (GSAP Pinned on Desktop) ── */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-[clamp(30px,5vw,50px)] font-medium text-[#0a0a0a] tracking-[-0.03em] leading-[1.08] font-sans">
              Study with focus. Win with your squad.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed font-sans max-w-xl">
              CronoBash is a multiplayer focus arena. Track real-time distraction telemetry, battle in 1v1 study duels, and level up with your squad.
            </p>
          </div>

          {/* Hero Lottie Showcase Animation */}
          <div className="relative w-full max-w-[260px] sm:max-w-[340px] aspect-square flex items-center justify-center py-2 mx-auto lg:mx-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-prompt-brown/10 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />
            <LottiePlayer
              src="/lottie/student.json"
              className="w-full h-full object-contain pointer-events-none relative z-10"
              loop={true}
              autoplay={true}
              priority={true}
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Cards with Individual Lottie Animations ── */}
        <div className="lg:col-span-6 relative w-full lg:h-[480px] lg:overflow-hidden flex flex-col gap-6 lg:block">
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.id}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="relative lg:absolute inset-0 w-full p-6 sm:p-8 lg:p-10 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {/* Fixed-size Icon Container (48px / w-12 h-12) */}
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 relative">
                    <LottiePlayer
                      src={pillar.lottieSrc}
                      className={`w-full h-full object-contain transform ${pillar.lottieScale}`}
                      loop={true}
                      autoplay={true}
                      priority={i === 0}
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-outline uppercase font-sans">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#0a0a0a] tracking-[-0.02em] font-sans">
                  {pillar.title}
                </h3>

                <p className="text-sm sm:text-base text-on-surface-variant font-normal leading-relaxed font-sans">
                  {pillar.tagline}
                </p>
              </div>

              {/* Card Body Detail */}
              <div className="pt-5 border-t border-outline-variant/30 space-y-4 mt-6 lg:mt-0">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-[#0a0a0a] font-normal leading-relaxed font-sans">
                  <CheckCircle2 className="w-4.5 h-4.5 text-prompt-brown shrink-0 mt-0.5" />
                  <span>{pillar.detail}</span>
                </div>

                <div className="text-xs font-semibold text-prompt-brown uppercase tracking-wider font-sans">
                  Metric: {pillar.stat}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}