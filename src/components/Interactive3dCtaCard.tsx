"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Interactive3dCtaCardProps {
  user?: any;
  splineSceneUrl?: string;
}

export default function Interactive3dCtaCard({ user }: Interactive3dCtaCardProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll-triggered reveal
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full min-h-[480px] sm:min-h-[560px] rounded-[44px] overflow-hidden border border-outline-variant/30 shadow-md"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}
    >
      {/* 100% Crystal Clear Background Video (Zero Blur) */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Subtle Overlay to ensure 100% Crisp Text Contrast over Sharp Video */}
      <div className="absolute inset-0 bg-black/35 z-[1] pointer-events-none" />

      {/* Un-boxed CTA Content (Transparent background box removed completely) */}
      <div className="absolute inset-0 z-[2] flex items-center justify-center px-6 py-16">
        <div className="relative w-full max-w-[720px] px-6 sm:px-12 text-center">
          
          <h2
            className="font-sans text-[clamp(32px,5vw,54px)] font-black leading-[1.04] tracking-tight mb-4 drop-shadow-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent"
            style={{ fontWeight: 900 }}
          >
            Start your next sprint.
          </h2>

          <p
            className="font-sans text-base sm:text-xl font-medium leading-relaxed mb-10 max-w-lg mx-auto drop-shadow-sm cta-text-white"
            style={{ color: '#ffffff' }}
          >
            Create your account in seconds and launch your first focus session. Your squad is waiting.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="bg-white text-[#0a0a0a] font-sans text-[15px] font-bold uppercase tracking-[0.05em] px-8 py-4 rounded-full transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-95 shadow-lg inline-flex items-center justify-center gap-2"
            >
              Start Focus Session
              <ArrowRight className="w-4 h-4 text-[#0a0a0a]" />
            </Link>

            <Link
              href="/rooms"
              className="bg-white/15 backdrop-blur-xs border border-white/40 text-white font-sans text-[15px] font-bold uppercase tracking-[0.05em] px-8 py-4 rounded-full transition-all hover:bg-white/25 hover:scale-[1.02] active:scale-95 inline-flex items-center justify-center"
            >
              Browse Squad Rooms
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
