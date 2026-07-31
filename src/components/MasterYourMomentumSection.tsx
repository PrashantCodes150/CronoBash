"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// Pre-generated 185 frame paths for the extracted video frames
const MOMENTUM_FRAMES = Array.from({ length: 185 }, (_, i) => 
  `/momentum-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`
);

export default function MasterYourMomentumSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Pin container section for 550vh of scroll distance
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Apple-grade fluid spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    mass: 0.25,
    restDelta: 0.0001,
  });

  // 1. High-performance frame preloading with GPU async decoding
  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    MOMENTUM_FRAMES.forEach((src, idx) => {
      const img = new Image();
      const onReady = () => {
        loadedCount++;
        if (loadedCount === MOMENTUM_FRAMES.length) {
          setImagesLoaded(true);
        }
      };

      img.onload = onReady;
      img.onerror = onReady;
      img.src = src;

      if ('decode' in img && typeof (img as any).decode === 'function') {
        (img as any).decode().catch(() => {});
      }

      imgArray[idx] = img;
    });

    loadedImagesRef.current = imgArray;
  }, []);

  // 2. High-performance Sub-Frame Alpha Interpolation Render Loop (60fps/120fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const progress = Math.min(1, Math.max(0, smoothProgress.get()));
      const width = canvas.width;
      const height = canvas.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const total = loadedImagesRef.current.length;

      if (total > 0) {
        // Map video progress from 0.16 -> 1.0 so video plays seamlessly on next scroll step
        const videoProgress = Math.min(1, Math.max(0, (progress - 0.16) / (1.0 - 0.16)));
        const floatFrame = videoProgress * (total - 1);
        const idx1 = Math.floor(floatFrame);
        const idx2 = Math.min(total - 1, idx1 + 1);
        const blend = floatFrame - idx1;

        const img1 = loadedImagesRef.current[idx1];
        const img2 = loadedImagesRef.current[idx2];

        if (img1 && img1.complete) {
          const hRatio = width / img1.width;
          const vRatio = height / img1.height;
          const ratio = Math.max(hRatio, vRatio);
          const shiftX = (width - img1.width * ratio) / 2;
          const shiftY = (height - img1.height * ratio) / 2;

          ctx.globalAlpha = 1.0;
          ctx.drawImage(
            img1, 0, 0, img1.width, img1.height,
            shiftX, shiftY, img1.width * ratio, img1.height * ratio
          );

          if (idx1 !== idx2 && img2 && img2.complete && blend > 0.005) {
            ctx.globalAlpha = blend;
            ctx.drawImage(
              img2, 0, 0, img2.width, img2.height,
              shiftX, shiftY, img2.width * ratio, img2.height * ratio
            );
          }
        }
      }

      animId = requestAnimationFrame(render);
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

  // ── STEP 1: "MASTER YOUR MOMENTUM." ENTERS FROM OUTSIDE DISPLAY TO LEFT SIDE ON WHITE DISPLAY (Progress 0.00 -> 0.16) ──
  const titleX = useTransform(smoothProgress, [0.00, 0.14], ['-100vw', '0vw']);
  const titleOpacity = useTransform(smoothProgress, [0.00, 0.08], [0, 1]);

  // Background Theme Transition (White display at start 0.00 -> 0.16, darkens as live hands video canvas reveals on scroll 0.16 -> 1.00)
  const canvasOpacity = useTransform(smoothProgress, [0.14, 0.20], [0, 1]);
  const darkOverlayOpacity = useTransform(smoothProgress, [0.14, 0.20], [0, 0.75]);

  // Title Text Color Transition (Dark slate on white display -> White on hands video canvas)
  const isVideoPhase = useTransform(smoothProgress, [0.16, 0.20], [0, 1]);

  // ── STEP 2: SEQUENTIAL CARDS REVEALS OVER LIVE HANDS VIDEO CANVAS (Progress 0.18 -> 1.00) ──
  const card1Opacity = useTransform(smoothProgress, [0.18, 0.22, 0.33, 0.37], [0, 1, 1, 0]);
  const card1Y = useTransform(smoothProgress, [0.18, 0.22, 0.33, 0.37], [40, 0, 0, -30]);

  const card2Opacity = useTransform(smoothProgress, [0.37, 0.41, 0.51, 0.55], [0, 1, 1, 0]);
  const card2Y = useTransform(smoothProgress, [0.37, 0.41, 0.51, 0.55], [40, 0, 0, -30]);

  const card3Opacity = useTransform(smoothProgress, [0.55, 0.59, 0.69, 0.73], [0, 1, 1, 0]);
  const card3Y = useTransform(smoothProgress, [0.55, 0.59, 0.69, 0.73], [40, 0, 0, -30]);

  const card4Opacity = useTransform(smoothProgress, [0.73, 0.77, 0.86, 0.90], [0, 1, 1, 0]);
  const card4Y = useTransform(smoothProgress, [0.73, 0.77, 0.86, 0.90], [40, 0, 0, -30]);

  const card5Opacity = useTransform(smoothProgress, [0.90, 0.94, 0.98, 1.00], [0, 1, 1, 1]);
  const card5Y = useTransform(smoothProgress, [0.90, 0.94], [40, 0]);

  // Step Indicators
  const step1Active = useTransform(smoothProgress, [0.18, 0.37], [1, 0.3]);
  const step2Active = useTransform(smoothProgress, [0.37, 0.55], [0.3, 1]);
  const step3Active = useTransform(smoothProgress, [0.55, 0.73], [0.3, 1]);
  const step4Active = useTransform(smoothProgress, [0.73, 0.90], [0.3, 1]);
  const step5Active = useTransform(smoothProgress, [0.90, 1.00], [0.3, 1]);

  return (
    <div ref={containerRef} id="bento" className="relative h-[550vh] w-full bg-[#ECEFF6]">
      
      {/* Sticky Viewport Pinned Container (Apple Product Scroll Effect) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center py-8 z-10 bg-[#ECEFF6]">
        
        {/* Fullscreen Apple-Style Frame Animation Canvas (Reveals on scroll step 2) */}
        <motion.canvas
          ref={canvasRef}
          style={{ opacity: canvasOpacity }}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        />

        {/* Dynamic Dark Vignette Overlay during video phase */}
        <motion.div
          style={{ opacity: darkOverlayOpacity }}
          className="absolute inset-0 bg-gradient-to-r from-[#050711]/90 via-[#050711]/70 to-[#050711]/90 pointer-events-none z-10"
        />

        <div className="max-w-[1440px] mx-auto px-5 md:px-12 w-full relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          
          {/* ── LEFT COLUMN: "MASTER YOUR MOMENTUM." SLIDES IN FROM OUTSIDE DISPLAY TO LEFT SIDE ── */}
          <motion.div
            style={{ x: titleX, opacity: titleOpacity }}
            className="lg:col-span-5 flex flex-col items-start text-left space-y-4 z-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
              PLATFORM OVERVIEW
            </div>

            <h2
              className="text-[38px] sm:text-[58px] lg:text-[72px] font-black tracking-tight leading-[1.02] uppercase text-[#334155]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              MASTER YOUR <br />
              <span className="bg-gradient-to-r from-[#FF5500] via-[#FF7700] to-[#FFDD00] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,85,0,0.4)]">
                MOMENTUM.
              </span>
            </h2>

            <p className="text-xs sm:text-base font-medium text-slate-600 max-w-md leading-relaxed">
              Scroll to unlock each tool built to engineer discipline and turn focus into an addictive sport.
            </p>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm w-fit mt-2">
              <motion.span style={{ opacity: step1Active }} className="text-xs font-mono font-bold text-[#FF5500]">01</motion.span>
              <span className="text-slate-300">•</span>
              <motion.span style={{ opacity: step2Active }} className="text-xs font-mono font-bold text-slate-700">02</motion.span>
              <span className="text-slate-300">•</span>
              <motion.span style={{ opacity: step3Active }} className="text-xs font-mono font-bold text-slate-700">03</motion.span>
              <span className="text-slate-300">•</span>
              <motion.span style={{ opacity: step4Active }} className="text-xs font-mono font-bold text-emerald-600">04</motion.span>
              <span className="text-slate-300">•</span>
              <motion.span style={{ opacity: step5Active }} className="text-xs font-mono font-bold text-amber-500">05</motion.span>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN: SEQUENTIAL FROSTED GLASS CARDS (Revealed one by one per scroll over video canvas) ── */}
          <div className="lg:col-span-7 relative h-[380px] sm:h-[420px] w-full flex items-center justify-center z-20">

            {/* ── CARD 01: Focus Sprint Timers ── */}
            <motion.div
              style={{ opacity: card1Opacity, y: card1Y }}
              className="absolute w-[92%] sm:w-[420px] rounded-3xl p-8 sm:p-10 border border-white/90 shadow-2xl bg-white/85 backdrop-blur-2xl text-[#334155] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    01
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/80">
                    <span className="material-symbols-outlined text-[26px] text-[#FF5500]">timer</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#334155]">
                  Focus Sprint Timers
                </h3>

                <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                  Synchronized 25m & 50m Pomodoro sprint timers with live arena status sync to prevent burnout.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 02: Deep Flow Analytics ── */}
            <motion.div
              style={{ opacity: card2Opacity, y: card2Y }}
              className="absolute w-[92%] sm:w-[420px] rounded-3xl p-8 sm:p-10 border border-white/90 shadow-2xl bg-white/85 backdrop-blur-2xl text-[#334155] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    02
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/80">
                    <span className="material-symbols-outlined text-[26px] text-[#334155]">monitoring</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#334155]">
                  Deep Flow Analytics
                </h3>

                <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                  Visualize daily study momentum, peak productivity heatmaps, and focus score trends in real-time.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 03: Multiplayer Squad Arenas ── */}
            <motion.div
              style={{ opacity: card3Opacity, y: card3Y }}
              className="absolute w-[92%] sm:w-[420px] rounded-3xl p-8 sm:p-10 border border-white/90 shadow-2xl bg-white/85 backdrop-blur-2xl text-[#334155] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    03
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/80">
                    <span className="material-symbols-outlined text-[26px] text-blue-600">groups</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#334155]">
                  Multiplayer Squad Arenas
                </h3>

                <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                  Join live study rooms with peer camera feeds, active focus logs, and squad leaderboards.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 04: AI Distraction Sentinel ── */}
            <motion.div
              style={{ opacity: card4Opacity, y: card4Y }}
              className="absolute w-[92%] sm:w-[420px] rounded-3xl p-8 sm:p-10 border border-white/90 shadow-2xl bg-white/85 backdrop-blur-2xl text-[#334155] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    04
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/80">
                    <span className="material-symbols-outlined text-[26px] text-emerald-600">center_focus_strong</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#334155]">
                  AI Distraction Sentinel
                </h3>

                <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                  On-device webcam micro-movement tracking & tab distraction detection calculate your exact focus score.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 05: 100-Tier Emblem Mastery ── */}
            <motion.div
              style={{ opacity: card5Opacity, y: card5Y }}
              className="absolute w-[92%] sm:w-[420px] rounded-3xl p-8 sm:p-10 border border-white/90 shadow-2xl bg-white/85 backdrop-blur-2xl text-[#334155] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    05
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/80">
                    <span className="material-symbols-outlined text-[26px] text-amber-500">workspace_premium</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#334155]">
                  100-Tier Emblem Mastery
                </h3>

                <p className="text-xs sm:text-sm text-[#44474c] leading-relaxed font-medium">
                  Earn XP for every focused minute and unlock 100 exclusive vector emblem badges as you level up.
                </p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>

    </div>
  );
}
