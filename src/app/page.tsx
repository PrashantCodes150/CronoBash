"use client";

import React, { useEffect } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import Hero from '@/components/Hero';
import AnimatedStatsStrip from '@/components/AnimatedStatsStrip';
import MotivationalTickerSection from '@/components/MotivationalTickerSection';
import LazyDistractionSection from '@/components/LazyDistractionSection';
import BentoFeaturesGrid from '@/components/BentoFeaturesGrid';
import DirectCashStakesSection from '@/components/DirectCashStakesSection';
import Climb100TiersMasteryHero from '@/components/Climb100TiersMasteryHero';
import TestimonialsSection from '@/components/TestimonialsSection';
import FaqSection from '@/components/FaqSection';
import Interactive3dCtaCard from '@/components/Interactive3dCtaCard';
import FounderNoteSection from '@/components/FounderNoteSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth-context';

export default function LandingPage() {
  const { user } = useAuth();

  // Scroll reveal fallback for non-GSAP elements
  useEffect(() => {
    function reveal() {
      const elements = document.querySelectorAll<HTMLElement>('.reveal');
      const windowHeight = window.innerHeight;
      elements.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < windowHeight - 100) {
          el.classList.add('active');
        }
      });
    }
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
    return () => window.removeEventListener('scroll', reveal);
  }, []);

  return (
    <main className="min-h-screen bg-surface text-on-surface antialiased selection:bg-prompt-brown selection:text-white overflow-x-hidden">
      {/* 1. HERO + FIXED NAV */}
      <Hero />

      {/* 2. ANIMATED STATS STRIP */}
      <AnimatedStatsStrip />

      {/* 3. GSAP + LENIS PINNED FEATURE CARDS & LOTTIE (Stable wrapper prevents DOM hierarchy error) */}
      <div className="w-full relative">
        <MotivationalTickerSection />
      </div>

      {/* 4. LAZY & DISTRACTED WHILE STUDYING? SOLUTION SECTION */}
      <LazyDistractionSection />

      {/* 5. BENTO GRID */}
      <BentoFeaturesGrid />

      {/* 6 & 7. STRETCHED ARTWORK BACKGROUND COVERING HIGH-STAKES DUELS & MASTERY TIERS */}
      <div className="relative w-full overflow-hidden">
        {/* Compressed Stretched Background Artwork (Faint watermark visibility) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <img
            src="/ancient-arena-bg.webp"
            alt=""
            className="w-full h-full object-cover opacity-[0.12] mix-blend-multiply filter contrast-125"
          />
          {/* Top & Bottom Smooth Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#fcf9f8] via-transparent to-[#fcf9f8] pointer-events-none" />
        </div>

        <div className="relative z-10">
          {/* 6. HIGH-STAKES FOCUS DUELS */}
          <DirectCashStakesSection />

          {/* 7. PROGRESSIVE MASTERY TIERS */}
          <Climb100TiersMasteryHero />
        </div>
      </div>

      {/* 8. TESTIMONIALS (Restored original responses of the people) */}
      <TestimonialsSection />

      {/* 9. FAQ (Restored original FAQs) */}
      <FaqSection />

      {/* 10. CTA CARD */}
      <section className="py-24 sm:py-32 w-full max-w-[1200px] mx-auto px-6 border-t border-surface-variant relative z-20">
        <Interactive3dCtaCard user={user} />
      </section>

      {/* 11. FOUNDER NOTE */}
      <FounderNoteSection />

      {/* 12. FOOTER */}
      <Footer />
    </main>
  );
}
