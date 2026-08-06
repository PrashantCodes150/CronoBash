"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import LottiePlayer from '@/components/LottiePlayer';

export default function LazyDistractionSection() {
  return (
    <section className="py-24 sm:py-32 w-full max-w-[1200px] mx-auto px-6 md:px-16 border-t border-surface-variant relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Cat Animation */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-prompt-brown/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center p-2">
            <LottiePlayer
              src="/lottie/cat-playing.json"
              className="w-full h-full object-contain pointer-events-none"
              loop={true}
              autoplay={true}
            />
          </div>
        </div>

        {/* Right Column: Larger High-Impact Title & Prominent CronoBash Wordmark */}
        <div className="lg:col-span-7 space-y-8 lg:pl-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Larger Title */}
            <h2 className="text-[clamp(36px,5.5vw,62px)] text-[#0a0a0a] tracking-[-0.03em] leading-[1.06] font-sans font-medium">
              Feeling lazy while studying?
              <br />
              <span className="text-on-surface-variant/80 font-normal">
                Or getting easily distracted?
              </span>
            </h2>

            {/* Much Larger CronoBash Wordmark Solution Statement */}
            <p className="text-xl sm:text-2xl text-on-surface-variant leading-relaxed font-sans font-normal pt-1">
              We have the answer for it —{' '}
              <span className="font-['Special_Elite'] text-[1.4em] text-[#0a0a0a] font-normal underline decoration-prompt-brown decoration-wavy decoration-3 underline-offset-8 inline-block ml-1">
                CronoBash
              </span>
            </p>
          </motion.div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 bg-[#0a0a0a] text-white rounded-full px-8 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.05em] hover:bg-[#333] active:scale-95 transition-all duration-200 shadow-sm"
            >
              End Distractions Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
