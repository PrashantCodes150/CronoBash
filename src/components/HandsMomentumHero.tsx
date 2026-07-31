"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// Pre-generated 185 frame paths for the extracted video frames
const HANDS_MOMENTUM_FRAMES = Array.from({ length: 185 }, (_, i) => 
  `/momentum-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`
);

interface HandsMomentumHeroProps {
  frames?: string[];
}

export default function HandsMomentumHero({
  frames = HANDS_MOMENTUM_FRAMES
}: HandsMomentumHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Track scroll progress within pinned 450vh container
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
    if (!frames || frames.length === 0) return;

    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    frames.forEach((src, idx) => {
      const img = new Image();
      img.src = src;

      const onReady = () => {
        loadedCount++;
        if (loadedCount === frames.length) {
          setImagesLoaded(true);
        }
      };

      img.onload = onReady;
      if (typeof img.decode === 'function') {
        img.decode().then(onReady).catch(() => {});
      }

      imgArray[idx] = img;
    });

    loadedImagesRef.current = imgArray;
  }, [frames]);

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
        const floatFrame = progress * (total - 1);
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

  // ── LAYER 1: HEADLINE LAYER TRANSITION (Progress 0.00 -> 0.22) ──
  // STRICTLY IN-PLACE Lens Dissolve/Focus: Zero vertical Y movement so it stays inside the exact same layer!
  const headlineOpacity = useTransform(smoothProgress, [0.00, 0.12, 0.18, 0.22], [1, 1, 1, 0]);
  const headlineScale = useTransform(smoothProgress, [0.00, 0.12, 0.18, 0.22], [1.0, 1.0, 1.06, 1.15]);
  const headlineFilter = useTransform(smoothProgress, [0.12, 0.22], ['blur(0px)', 'blur(18px)']);

  // ── LAYER 2: CARDS LAYER TRANSITION (Strictly In-Place Inside the Exact Same Viewport Layer: Progress 0.22 -> 1.00) ──
  const cardsLayerOpacity = useTransform(smoothProgress, [0.18, 0.24], [0, 1]);
  const cardsLayerScale = useTransform(smoothProgress, [0.18, 0.24], [0.92, 1.0]);

  // Cards Sequential Reveals (One by one in exact same display area without vertical shifting)
  const card1Opacity = useTransform(smoothProgress, [0.22, 0.26, 0.36, 0.40], [0, 1, 1, 0]);
  const card1Scale = useTransform(smoothProgress, [0.22, 0.26, 0.36, 0.40], [0.94, 1.0, 1.0, 0.96]);

  const card2Opacity = useTransform(smoothProgress, [0.40, 0.44, 0.54, 0.58], [0, 1, 1, 0]);
  const card2Scale = useTransform(smoothProgress, [0.40, 0.44, 0.54, 0.58], [0.94, 1.0, 1.0, 0.96]);

  const card3Opacity = useTransform(smoothProgress, [0.58, 0.62, 0.72, 0.76], [0, 1, 1, 0]);
  const card3Scale = useTransform(smoothProgress, [0.58, 0.62, 0.72, 0.76], [0.94, 1.0, 1.0, 0.96]);

  const card4Opacity = useTransform(smoothProgress, [0.76, 0.80, 0.90, 0.94], [0, 1, 1, 0]);
  const card4Scale = useTransform(smoothProgress, [0.76, 0.80, 0.90, 0.94], [0.94, 1.0, 1.0, 0.96]);

  const card5Opacity = useTransform(smoothProgress, [0.94, 0.97, 0.99, 1.00], [0, 1, 1, 1]);
  const card5Scale = useTransform(smoothProgress, [0.94, 0.97], [0.94, 1.0]);

  // Step Indicators
  const step1Active = useTransform(smoothProgress, [0.22, 0.40], [1, 0.3]);
  const step2Active = useTransform(smoothProgress, [0.40, 0.58], [0.3, 1]);
  const step3Active = useTransform(smoothProgress, [0.58, 0.76], [0.3, 1]);
  const step4Active = useTransform(smoothProgress, [0.76, 0.94], [0.3, 1]);
  const step5Active = useTransform(smoothProgress, [0.94, 1.00], [0.3, 1]);

  return (
    <div ref={containerRef} className="relative h-[450vh] w-full bg-[#050711]">
      
      {/* Sticky Viewport Pinned Container (Apple Product Scroll Effect) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center py-10 z-10 bg-[#050711]">
        
        {/* Fullscreen High-Performance Frame Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />

        {/* Subtle Edge Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050711]/90 via-transparent to-[#050711]/70 pointer-events-none z-10" />

        <div className="max-w-[1280px] mx-auto px-5 md:px-12 w-full relative z-20 flex flex-col items-center justify-center h-full">
          
          {/* ── STAGE 1: FRONT HEADLINE LAYER (Strictly In-Place Dissolve inside the Layer) ── */}
          <motion.div
            style={{
              opacity: headlineOpacity,
              scale: headlineScale,
              filter: headlineFilter,
              pointerEvents: headlineOpacity.get() > 0.1 ? 'auto' : 'none',
            }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto z-30"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
              FOCUS ARENA EVOLUTION
            </div>

            <h2
              className="text-[44px] sm:text-[68px] lg:text-[88px] font-black text-white tracking-tight leading-[1.02]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Solitary Study <br />
              <span className="bg-gradient-to-r from-[#FF5500] via-[#FF7700] to-[#FFDD00] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,85,0,0.5)]">
                is Dead.
              </span> <br />
              <span className="text-white">Welcome to the Arena.</span>
            </h2>
          </motion.div>

          {/* ── STAGE 2: CARDS LAYER (Strictly In-Place Inside the Exact Same Viewport Container) ── */}
          <motion.div
            style={{
              opacity: cardsLayerOpacity,
              scale: cardsLayerScale,
            }}
            className="absolute inset-0 flex items-center justify-center p-4 max-w-2xl mx-auto z-20"
          >
            {/* Step Indicators */}
            <div className="absolute top-16 flex items-center gap-3 text-xs font-mono font-bold text-white z-20">
              <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-5 py-2 rounded-full border border-slate-800 shadow-lg">
                <motion.span style={{ opacity: step1Active }} className="text-[#FF5500]">01 TIMERS</motion.span>
                <span className="text-slate-600">•</span>
                <motion.span style={{ opacity: step2Active }} className="text-slate-300">02 ANALYTICS</motion.span>
                <span className="text-slate-600">•</span>
                <motion.span style={{ opacity: step3Active }} className="text-blue-400">03 SQUADS</motion.span>
                <span className="text-slate-600">•</span>
                <motion.span style={{ opacity: step4Active }} className="text-emerald-400">04 SENTINEL</motion.span>
                <span className="text-slate-600">•</span>
                <motion.span style={{ opacity: step5Active }} className="text-amber-400">05 EMBLEMS</motion.span>
              </div>
            </div>

            {/* ── CARD 01: Focus Sprint Timers ── */}
            <motion.div
              style={{ opacity: card1Opacity, scale: card1Scale }}
              className="absolute w-full rounded-3xl p-8 sm:p-10 border border-white/25 shadow-2xl bg-white/10 backdrop-blur-2xl text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    01
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-[26px]">timer</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Focus Sprint Timers
                </h3>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  Synchronized 25m & 50m Pomodoro sprint timers with live arena status sync to keep you in peak flow state.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 02: Deep Flow Analytics ── */}
            <motion.div
              style={{ opacity: card2Opacity, scale: card2Scale }}
              className="absolute w-full rounded-3xl p-8 sm:p-10 border border-white/25 shadow-2xl bg-white/10 backdrop-blur-2xl text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    02
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-[26px]">monitoring</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Deep Flow Analytics
                </h3>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  Visualize daily study momentum, peak productivity heatmaps, and focus score trends in real-time.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 03: Multiplayer Squad Arenas ── */}
            <motion.div
              style={{ opacity: card3Opacity, scale: card3Scale }}
              className="absolute w-full rounded-3xl p-8 sm:p-10 border border-white/25 shadow-2xl bg-white/10 backdrop-blur-2xl text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    03
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-[26px]">groups</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Multiplayer Squad Arenas
                </h3>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  Join live study rooms with peer camera feeds, active focus logs, and squad leaderboards.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 04: AI Distraction Sentinel ── */}
            <motion.div
              style={{ opacity: card4Opacity, scale: card4Scale }}
              className="absolute w-full rounded-3xl p-8 sm:p-10 border border-white/25 shadow-2xl bg-white/10 backdrop-blur-2xl text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    04
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-[26px]">center_focus_strong</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  AI Distraction Sentinel
                </h3>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  On-device webcam micro-movement tracking & tab distraction detection calculate your exact focus score.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 05: 100-Tier Emblem Mastery ── */}
            <motion.div
              style={{ opacity: card5Opacity, scale: card5Scale }}
              className="absolute w-full rounded-3xl p-8 sm:p-10 border border-white/25 shadow-2xl bg-white/10 backdrop-blur-2xl text-white flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    05
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  100-Tier Emblem Mastery
                </h3>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  Earn XP for every focused minute and unlock 100 exclusive vector emblem badges as you level up.
                </p>
              </div>
            </motion.div>

          </motion.div>

        </div>

      </div>

    </div>
  );
}
