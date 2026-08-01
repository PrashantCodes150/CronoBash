"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { useFramePreloader } from '@/hooks/useFramePreloader';

interface CronoBashWorkflowSectionProps {
  frames: string[];
  user?: any;
}

export default function CronoBashWorkflowSection({ frames, user }: CronoBashWorkflowSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Track scroll progress through the pinned Section (300vh = exactly 1 natural scroll step per card)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Instantaneous step trigger based on raw scrollYProgress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (p) => {
      const progress = Math.min(1, Math.max(0, p));
      if (progress < 0.25) setActiveStep(0);
      else if (progress < 0.50) setActiveStep(1);
      else if (progress < 0.75) setActiveStep(2);
      else setActiveStep(3);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Ultra-Responsive 1-to-1 Scroll Tracking (Zero Lag, Butter-Smooth 120fps)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 450,
    damping: 35,
    mass: 0.02,
    restDelta: 0.0001,
  });

  // Queue-batched frame preloading & fallback rendering
  const { loadedImagesRef, getFrameOrFallback } = useFramePreloader(frames, {
    enabled: true,
    concurrency: 12,
    priorityCount: 12,
  });

  // Full-bleed video frame canvas render loop with 120fps sub-frame interpolation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastDrawnFrame = -1;

    const render = () => {
      animId = requestAnimationFrame(render);

      const rawProgress = Math.min(1, Math.max(0, scrollYProgress.get()));
      const total = loadedImagesRef.current.length;
      if (total === 0) return;

      const floatFrame = rawProgress * (total - 1);

      // Deadzone check: Freeze canvas when stationary, zero lag when scrolling
      if (Math.abs(floatFrame - lastDrawnFrame) < 0.001 && lastDrawnFrame !== -1) {
        return;
      }

      lastDrawnFrame = floatFrame;

      const width = canvas.width;
      const height = canvas.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const idx1 = Math.floor(floatFrame);
      const idx2 = Math.min(total - 1, idx1 + 1);
      const blend = floatFrame - idx1;

      const img1 = getFrameOrFallback(idx1);
      const img2 = loadedImagesRef.current[idx2];

      if (img1 && img1.complete) {
        const hRatio = width / img1.width;
        const vRatio = height / img1.height;
        const ratio = Math.max(hRatio, vRatio);
        const drawW = Math.round(img1.width * ratio);
        const drawH = Math.round(img1.height * ratio);
        const shiftX = Math.round((width - drawW) / 2);
        const shiftY = Math.round((height - drawH) / 2);

        ctx.globalAlpha = 1.0;
        ctx.drawImage(
          img1, 0, 0, img1.width, img1.height,
          shiftX, shiftY, drawW, drawH
        );

        if (idx1 !== idx2 && img2 && img2.complete && blend > 0.01) {
          ctx.globalAlpha = blend;
          ctx.drawImage(
            img2, 0, 0, img2.width, img2.height,
            shiftX, shiftY, drawW, drawH
          );
        }
      }
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth || window.innerWidth;
      const displayHeight = canvas.clientHeight || window.innerHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [smoothProgress]);

  // Original 4 Workflow Steps Data
  const WORKFLOW_STEPS = [
    {
      step: '01',
      title: 'Create Account & Join Arena',
      subtitle: 'Sign up in 30 seconds and enter a public study room or create a private squad arena for your friends.',
      badge: 'STEP 1: SQUAD LOBBY',
      icon: 'groups',
      previewTitle: 'Alpha Squad Arena #04',
      previewDetails: '8 Members Active · 24m Sprint',
    },
    {
      step: '02',
      title: 'Set Cash Stake & Challenge',
      subtitle: 'Choose a 1v1 battle match or group pool. Set direct money stakes (₹50, ₹100, ₹500) for the focus sprint.',
      badge: 'STEP 2: CASH MATCH',
      icon: 'payments',
      previewTitle: '1v1 Money Battle: ₹500 Pot',
      previewDetails: 'Winner Takes Pot Based on Focus Score',
    },
    {
      step: '03',
      title: '1v1 Focus Sprint Battle',
      subtitle: 'Hit start. Run your timed focus sprint (25m/45m/60m). Your focus score is tracked and logged in real time.',
      badge: 'STEP 3: LIVE SPRINT',
      icon: 'timer',
      previewTitle: 'Sprint Active: 24:59',
      previewDetails: 'Focus Score: 98.4% · Peak Flow State',
    },
    {
      step: '04',
      title: 'Instant Payout & Level Up',
      subtitle: 'The winner receives the entire cash pot directly into their linked wallet balance, plus XP to level up.',
      badge: 'STEP 4: INSTANT PAYOUT',
      icon: 'account_balance_wallet',
      previewTitle: '₹1,000 Cash Transferred',
      previewDetails: '+450 XP · Level 12 Emblem Unlocked',
    },
  ];

  const currentWorkflow = WORKFLOW_STEPS[activeStep];

  return (
    <div ref={containerRef} id="workflow" className="relative h-[320vh] w-full bg-[#ECEFF6]">
      
      {/* Sticky Full-Screen Viewport Pinned while Video Frames Pan */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center py-6 px-4">
        
        {/* Full Bleed Background Frame Canvas */}
        <canvas
          ref={canvasRef}
          style={{ transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        />

        {/* Soft Vignette Overlay for Crisp Typography & Card Readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-white/30 via-white/10 to-transparent pointer-events-none" />

        {/* Content Container: Original 2-Column Cards Layout */}
        <div className="relative z-20 max-w-[1440px] mx-auto px-5 md:px-16 w-full">
          
          <div className="space-y-4 sm:space-y-6">
            
            {/* Header Section */}
            <div className="max-w-3xl mb-2 sm:mb-4 text-center mx-auto">
              <h2
                className="text-[28px] sm:text-[40px] md:text-[52px] lg:text-[60px] text-[#334155] tracking-normal leading-[1.05] font-extrabold drop-shadow-sm"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                How CronoBash <br />
                <span className="text-slate-500/80 italic font-serif font-normal">Works</span><span style={{ color: '#FF5500' }}>.</span>
              </h2>
            </div>

            {/* Original 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* Left Column: Original 4 Timeline Step Cards */}
              <div className="lg:col-span-6 space-y-3 sm:space-y-4">
                {WORKFLOW_STEPS.map((s, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <div
                      key={s.step}
                      onClick={() => setActiveStep(idx)}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-white/40 backdrop-blur-xl border-white/80 shadow-[0_15px_35px_rgba(51,65,85,0.12)] ring-1 ring-[#FF5500]/40 scale-[1.02]'
                          : 'bg-white/15 backdrop-blur-md border-white/50 shadow-sm hover:bg-white/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold shrink-0 transition-colors ${
                            isActive
                              ? 'bg-[#334155] text-white shadow-md shadow-[#334155]/20'
                              : 'bg-slate-200/50 backdrop-blur-sm text-[#44474c]'
                          }`}
                        >
                          {s.step}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`text-base sm:text-lg font-bold transition-colors ${
                                isActive ? 'text-[#334155]' : 'text-[#44474c]'
                              }`}
                            >
                              {s.title}
                            </h3>
                            {isActive && (
                              <span className="material-symbols-outlined text-[#334155] text-[20px] animate-pulse">
                                arrow_forward
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                            {s.subtitle}
                          </p>

                          {/* Animated Progress Bar */}
                          {isActive && (
                            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mt-2.5">
                              <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3, ease: 'linear' }}
                                className="bg-[#FF5500] h-full rounded-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Original Dynamic Glass Preview Mockup Box */}
              <div className="lg:col-span-6">
                <div className="bg-white/35 backdrop-blur-2xl border border-white/80 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(51,65,85,0.15)] min-h-[350px] flex flex-col justify-between relative overflow-hidden">
                  
                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#334155]/5 rounded-full blur-3xl pointer-events-none" />

                  <AnimatePresence>
                    <motion.div
                      key={currentWorkflow.step}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="space-y-6 z-10"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
                        <span className="text-xs font-bold text-[#334155] uppercase tracking-normal flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">
                            {currentWorkflow.icon}
                          </span>
                          {currentWorkflow.badge}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          LIVE DEMO
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xl sm:text-2xl font-bold text-[#334155]">
                          {currentWorkflow.previewTitle}
                        </h4>
                        <p className="text-sm font-semibold text-[#44474c]">
                          {currentWorkflow.previewDetails}
                        </p>
                      </div>

                      {/* Step Specific Visual Card Mockups */}
                      {activeStep === 0 && (
                        <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#334155] text-white flex items-center justify-center font-bold text-xs">
                              SQUAD
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#334155]">Engineering Arena</div>
                              <div className="text-xs text-[#44474c]">8 Members Ready</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">ONLINE</span>
                        </div>
                      )}

                      {activeStep === 1 && (
                        <div className="p-4 bg-gradient-to-r from-[#334155] to-[#0f172a] text-white rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="text-xs text-yellow-300 font-bold uppercase">STAKE AMOUNT</div>
                            <div className="text-2xl font-extrabold">
                              ₹500 Cash Pot
                            </div>
                          </div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
                            MATCH LOCKED
                          </div>
                        </div>
                      )}

                      {activeStep === 2 && (
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
                          <div>
                            <div className="text-xs text-[#44474c] uppercase font-bold">SPRINT COUNTDOWN</div>
                            <div className="text-3xl font-extrabold text-[#334155]">
                              24:59
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full border-4 border-[#334155]/20 border-t-[#334155] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px] text-[#334155]">pause</span>
                          </div>
                        </div>
                      )}

                      {activeStep === 3 && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-emerald-900">
                          <div>
                            <div className="text-xs font-bold uppercase text-emerald-700">VICTORY PAYOUT</div>
                            <div className="text-2xl font-extrabold text-emerald-900">
                              ₹1,000 Transferred
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[28px] text-emerald-600">
                            check_circle
                          </span>
                        </div>
                      )}

                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-6 pt-4 border-t border-slate-200/50 flex justify-between items-center text-xs font-bold text-[#44474c] z-10">
                    <span>STEP {activeStep + 1} OF 4</span>
                    <Link
                      href={user ? "/dashboard" : "/signup"}
                      className="text-[#334155] hover:text-[#0f172a] flex items-center gap-1"
                    >
                      Start Sprint Now →
                    </Link>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
