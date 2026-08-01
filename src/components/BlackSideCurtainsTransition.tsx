"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Pre-generated 175 frame paths for the extracted video frames (Verified exact count in public/momentum-frames)
const MOMENTUM_FRAMES = Array.from({ length: 175 }, (_, i) => 
  `/momentum-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`
);

export default function BlackSideCurtainsTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sineCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameObjRef = useRef({ frame: 0 });
  const [syncFactor, setSyncFactor] = useState(0);

  // Calibrated 750vh height for perfectly seamless section-to-section unpinning
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Zero-lag spring physics for 1-to-1 Lenis inertia locking
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 48,
    mass: 0.08,
    restDelta: 0.0001,
  });

  // ── PHASE 1 SHUTTERS MOTION ──
  const leftCurtainX = useTransform(
    smoothProgress,
    [0.02, 0.05, 0.48, 0.54],
    ['-100%', '0%', '0%', '-100%']
  );

  const rightCurtainX = useTransform(
    smoothProgress,
    [0.02, 0.05, 0.48, 0.54],
    ['100%', '0%', '0%', '100%']
  );

  // Wave Sync Factor for 4 Cards in Phase 1
  const syncProgress = useTransform(
    smoothProgress,
    [
      0.06, 0.09, 0.14, 0.17,
      0.17, 0.20, 0.25, 0.28,
      0.28, 0.31, 0.36, 0.39,
      0.39, 0.42, 0.46, 0.49,
    ],
    [
      0, 1, 1, 0,
      0, 1, 1, 0,
      0, 1, 1, 0,
      0, 1, 1, 0,
    ]
  );

  // Phase 1 Cards (Spacious, Slow, Smooth Scroll Ranges)
  const c1Opacity = useTransform(smoothProgress, [0.06, 0.09, 0.14, 0.17], [0, 1, 1, 0]);
  const c1T = useTransform(smoothProgress, [0.06, 0.17], [0, 1]);

  const c2Opacity = useTransform(smoothProgress, [0.17, 0.20, 0.25, 0.28], [0, 1, 1, 0]);
  const c2T = useTransform(smoothProgress, [0.17, 0.28], [0, 1]);

  const c3Opacity = useTransform(smoothProgress, [0.28, 0.31, 0.36, 0.39], [0, 1, 1, 0]);
  const c3T = useTransform(smoothProgress, [0.28, 0.39], [0, 1]);

  const c4Opacity = useTransform(smoothProgress, [0.39, 0.42, 0.46, 0.49], [0, 1, 1, 0]);
  const c4T = useTransform(smoothProgress, [0.39, 0.49], [0, 1]);

  useEffect(() => {
    const unsubscribe = syncProgress.on('change', (v) => {
      setSyncFactor(v);
    });
    return () => unsubscribe();
  }, [syncProgress]);

  // Preload 175 frames for Master Your Momentum video phase
  useEffect(() => {
    const imgArray: HTMLImageElement[] = [];

    MOMENTUM_FRAMES.forEach((src, idx) => {
      const img = new Image();
      img.src = src;

      if ('decode' in img) {
        img.decode().catch(() => {});
      }
      imgArray[idx] = img;
    });

    loadedImagesRef.current = imgArray;
  }, []);

  // ── GSAP & LENIS COMBINED SMOOTH VIDEO FRAME SCRUBBING ENGINE ──
  useEffect(() => {
    if (!containerRef.current) return;

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4, // GSAP smooth inertia scrubbing combined with Lenis
      onUpdate: (self) => {
        const p = self.progress;
        if (p >= 0.49) {
          const videoProgress = Math.min(1, Math.max(0, (p - 0.51) / 0.49));
          const targetFrame = videoProgress * 174;
          
          gsap.to(currentFrameObjRef.current, {
            frame: targetFrame,
            duration: 0.2,
            ease: 'power1.out',
            overwrite: 'auto',
          });
        }
      },
    });

    return () => st.kill();
  }, []);

  // ── SHARP WHITE DOTS STARFIELD CANVAS RAF ENGINE ──
  useEffect(() => {
    const canvas = starCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.clientHeight || window.innerHeight);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() < 0.15 ? Math.random() * 2.2 + 1.2 : Math.random() * 1.0 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        star.phase += star.speed;
        const currentAlpha = Math.max(0.2, star.alpha + Math.sin(star.phase) * 0.3);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();

        if (star.radius > 1.8) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.25})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth || window.innerWidth;
      height = canvas.height = canvas.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sine Wave Canvas RAF Engine (Phase 1)
  useEffect(() => {
    const canvas = sineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const yStart = h * 0.20;
      const yEnd = h * 0.80;
      const midY = (yStart + yEnd) / 2;
      const arcRadiusY = (yEnd - yStart) / 2;

      const baseWaves = [
        { color: [255, 85, 0], width: 4.5, amp: 24, speed: phase, radiusX: w * 0.72 },
        { color: [255, 125, 0], width: 3.5, amp: 20, speed: -phase * 0.9, radiusX: w * 0.60 },
        { color: [59, 130, 246], width: 3.0, amp: 18, speed: phase * 1.1, radiusX: w * 0.50 },
        { color: [16, 185, 129], width: 2.8, amp: 16, speed: -phase * 1.2, radiusX: w * 0.40 },
        { color: [139, 92, 246], width: 2.5, amp: 14, speed: phase * 0.85, radiusX: w * 0.30 },
        { color: [245, 158, 11], width: 2.2, amp: 12, speed: -phase * 1.0, radiusX: w * 0.20 },
      ];

      const primaryRadiusX = w * 0.65;
      const primaryAmp = 26;
      const primaryColor = [255, 85, 0];

      baseWaves.forEach((wCfg) => {
        const curRadiusX = wCfg.radiusX + (primaryRadiusX - wCfg.radiusX) * syncFactor;
        const curAmp = wCfg.amp + (primaryAmp - wCfg.amp) * syncFactor;
        const curLineWidth = wCfg.width + (5.5 - wCfg.width) * syncFactor;

        const r = Math.round(wCfg.color[0] + (primaryColor[0] - wCfg.color[0]) * syncFactor);
        const g = Math.round(wCfg.color[1] + (primaryColor[1] - wCfg.color[1]) * syncFactor);
        const b = Math.round(wCfg.color[2] + (primaryColor[2] - wCfg.color[2]) * syncFactor);
        const strokeColor = `rgba(${r}, ${g}, ${b}, ${0.85 + syncFactor * 0.15})`;

        ctx.beginPath();
        ctx.lineWidth = curLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = `rgba(255, 85, 0, ${0.4 + syncFactor * 0.5})`;
        ctx.shadowBlur = 10 + syncFactor * 12;

        const points = 120;
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const theta = t * Math.PI - Math.PI / 2;

          const baseArcX = Math.cos(theta) * curRadiusX;
          const baseArcY = midY + Math.sin(theta) * arcRadiusY;

          const curSpeed = wCfg.speed + (phase - wCfg.speed) * syncFactor;
          const waveEnvelope = Math.sin(t * Math.PI);
          const waveOffset = Math.sin(t * Math.PI * 6 + curSpeed) * curAmp * waveEnvelope;
          const finalX = Math.max(0, baseArcX + waveOffset);
          const finalY = baseArcY;

          if (i === 0) ctx.moveTo(finalX, finalY);
          else ctx.lineTo(finalX, finalY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth || window.innerWidth / 2;
      canvas.height = canvas.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [syncFactor]);

  // Hands Video Frame Canvas RAF Engine with Sub-Frame Blend Interpolation
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastDrawnFrame = -1;

    const render = () => {
      animId = requestAnimationFrame(render);

      const total = loadedImagesRef.current.length;
      const floatFrame = currentFrameObjRef.current.frame;

      if (total === 0 || floatFrame < 0.1) return;

      if (Math.abs(floatFrame - lastDrawnFrame) < 0.005 && lastDrawnFrame !== -1) {
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

      const img1 = loadedImagesRef.current[idx1];
      const img2 = loadedImagesRef.current[idx2];

      if (img1 && img1.complete && img1.naturalWidth > 0 && img1.naturalHeight > 0) {
        const hRatio = width / img1.naturalWidth;
        const vRatio = height / img1.naturalHeight;
        const ratio = Math.max(hRatio, vRatio);
        const drawW = Math.round(img1.naturalWidth * ratio);
        const drawH = Math.round(img1.naturalHeight * ratio);
        const shiftX = Math.round((width - drawW) / 2);
        const shiftY = Math.round((height - drawH) / 2 + 45); // Shift down by 45px so top hand tips are fully unclipped

        ctx.globalAlpha = 1.0;
        ctx.drawImage(
          img1, 0, 0, img1.naturalWidth, img1.naturalHeight,
          shiftX, shiftY, drawW, drawH
        );

        if (idx1 !== idx2 && img2 && img2.complete && img2.naturalWidth > 0 && blend > 0.01) {
          ctx.globalAlpha = blend;
          ctx.drawImage(
            img2, 0, 0, img2.naturalWidth, img2.naturalHeight,
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
  }, []);

  // Helper hook to compute exact (X, Y) coordinates along wave (Gentle, smooth motion)
  const useWaveTransform = (tVal: any) => {
    const yPos = useTransform(tVal, [0, 1], ['-60px', '60px']);
    const xPos = useTransform(tVal, (t: number) => {
      const angle = t * Math.PI - Math.PI / 2;
      return `${Math.cos(angle) * 35}px`;
    });
    return { x: xPos, y: yPos };
  };

  const card1Pos = useWaveTransform(c1T);
  const card2Pos = useWaveTransform(c2T);
  const card3Pos = useWaveTransform(c3T);
  const card4Pos = useWaveTransform(c4T);

  // ── PURE WHITE BACKGROUND FOR PHASE 1 ENTRY -> PITCH BLACK STARFIELD FOR PHASE 2 MOMENTUM ──
  const starfieldOpacity = useTransform(smoothProgress, [0.48, 0.53], [0, 1]);

  // ── LENIS-STYLE GIANT KEYHOLE TYPOGRAPHY UNFOLD ──
  const lenisScale = useTransform(smoothProgress, [0.49, 0.57], [4.5, 1.0]);
  const lenisX = useTransform(smoothProgress, [0.49, 0.57], ['26vw', '0vw']);
  const lenisY = useTransform(smoothProgress, [0.49, 0.57], ['-25vh', '0vh']);
  const lenisOpacity = useTransform(smoothProgress, [0.48, 0.53], [0, 1]);

  // Hidden letters/words behind curtains reveal as curtains slide apart
  const curtainHiddenLettersOpacity = useTransform(smoothProgress, [0.50, 0.55], [0, 1]);

  // Hands video canvas starts fading in earlier (0.51 -> 0.57)
  const videoCanvasOpacity = useTransform(smoothProgress, [0.51, 0.57], [0, 1]);
  const darkOverlayOpacity = useTransform(smoothProgress, [0.51, 0.57], [0, 0.15]);

  // ── SPACIOUS BENTO CARDS SCROLL TIMING ──
  const bento1Opacity = useTransform(smoothProgress, [0.57, 0.62, 0.67, 0.70], [0, 1, 1, 0]);
  const bento1Y = useTransform(smoothProgress, [0.57, 0.62, 0.67, 0.70], [40, 0, 0, -30]);

  const bento2Opacity = useTransform(smoothProgress, [0.70, 0.74, 0.78, 0.81], [0, 1, 1, 0]);
  const bento2Y = useTransform(smoothProgress, [0.70, 0.74, 0.78, 0.81], [40, 0, 0, -30]);

  const bento3Opacity = useTransform(smoothProgress, [0.81, 0.85, 0.89, 0.91], [0, 1, 1, 0]);
  const bento3Y = useTransform(smoothProgress, [0.81, 0.85, 0.89, 0.91], [40, 0, 0, -30]);

  const bento4Opacity = useTransform(smoothProgress, [0.91, 0.94, 0.96, 0.98], [0, 1, 1, 0]);
  const bento4Y = useTransform(smoothProgress, [0.91, 0.94, 0.96, 0.98], [40, 0, 0, -30]);

  const bento5Opacity = useTransform(smoothProgress, [0.98, 0.99, 1.00], [0, 1, 1]);
  const bento5Y = useTransform(smoothProgress, [0.98, 0.99, 1.00], [40, 0, 0]);

  return (
    <div ref={containerRef} className="relative h-[900vh] w-full bg-white">
      
      {/* Sticky Full-Screen Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-30 flex items-center justify-center pointer-events-auto bg-white">
        
        {/* ── PURE WHITE BACKGROUND BEHIND PHASE 1 CURTAINS ── */}
        <div className="absolute inset-0 z-0 bg-white" />

        {/* ── BENEATH LAYER (z-10): STARFIELD & HANDS VIDEO CANVAS ── */}
        <motion.div
          style={{ opacity: starfieldOpacity }}
          className="absolute inset-0 z-10 w-full h-full flex items-center justify-center overflow-hidden bg-[#050711]"
        >
          
          {/* Sharp White Star Dots Canvas */}
          <canvas
            ref={starCanvasRef}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />

          {/* Hands Video Frame Animation Canvas */}
          <motion.canvas
            ref={videoCanvasRef}
            style={{ opacity: videoCanvasOpacity, transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
          />

          {/* Subtle Contrast Gradient Vignette */}
          <motion.div
            style={{ opacity: darkOverlayOpacity }}
            className="absolute inset-0 bg-gradient-to-t from-[#050711]/60 via-transparent to-[#050711]/60 pointer-events-none z-15"
          />

          {/* ── SMALLER PINNED HEADLINE ── */}
          <motion.div
            style={{
              x: lenisX,
              y: lenisY,
              scale: lenisScale,
              opacity: lenisOpacity,
            }}
            className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 lg:bottom-12 lg:left-12 max-w-xs sm:max-w-md z-20 text-left pointer-events-none origin-bottom-left"
          >
            <h2
              className="text-[24px] sm:text-[36px] lg:text-[46px] font-black tracking-tight leading-[1.05] uppercase text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <span>
                <motion.span style={{ opacity: curtainHiddenLettersOpacity }}>MAS</motion.span>
                <span className="text-[#FF5500] font-black">T</span>
                <motion.span style={{ opacity: curtainHiddenLettersOpacity }}>ER</motion.span>
              </span>
              <br />
              <motion.span
                style={{ opacity: curtainHiddenLettersOpacity, color: '#FF5500' }}
                className="inline-block"
              >
                YOUR MOMENTUM.
              </motion.span>
            </h2>
          </motion.div>

          {/* ── CENTER-RIGHT CARDS VIEWPORT ── */}
          <div className="absolute top-1/2 -translate-y-1/2 right-5 sm:right-10 lg:right-16 w-[92%] sm:w-[420px] lg:w-[450px] h-[380px] sm:h-[420px] flex items-center justify-center z-20">

            {/* CARD 01 */}
            <motion.div
              style={{ opacity: bento1Opacity, y: bento1Y }}
              className="absolute w-full rounded-3xl p-7 sm:p-9 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-[#070b19]/50 backdrop-blur-2xl text-white flex flex-col justify-between ring-1 ring-white/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    01
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Focus Sprint Timers
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Synchronized 25m & 50m Pomodoro sprint timers built with live squad sync to lock into flow state.
                </p>
              </div>
            </motion.div>

            {/* CARD 02 */}
            <motion.div
              style={{ opacity: bento2Opacity, y: bento2Y }}
              className="absolute w-full rounded-3xl p-7 sm:p-9 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-[#070b19]/50 backdrop-blur-2xl text-white flex flex-col justify-between ring-1 ring-white/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    02
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Deep Flow Analytics
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Track your daily focus hours, peak productivity heatmaps, and consistency metrics in real time.
                </p>
              </div>
            </motion.div>

            {/* CARD 03 */}
            <motion.div
              style={{ opacity: bento3Opacity, y: bento3Y }}
              className="absolute w-full rounded-3xl p-7 sm:p-9 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-[#070b19]/50 backdrop-blur-2xl text-white flex flex-col justify-between ring-1 ring-white/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    03
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Multiplayer Squad Arenas
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Join live study rooms with peer camera feeds, active focus logs, and real-time accountability.
                </p>
              </div>
            </motion.div>

            {/* CARD 04 */}
            <motion.div
              style={{ opacity: bento4Opacity, y: bento4Y }}
              className="absolute w-full rounded-3xl p-7 sm:p-9 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-[#070b19]/50 backdrop-blur-2xl text-white flex flex-col justify-between ring-1 ring-white/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    04
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Distraction Sentinel
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  On-device micro-movement tracking and active tab detection keep your focus uninterrupted.
                </p>
              </div>
            </motion.div>

            {/* CARD 05 */}
            <motion.div
              style={{ opacity: bento5Opacity, y: bento5Y }}
              className="absolute w-full rounded-3xl p-7 sm:p-9 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-[#070b19]/50 backdrop-blur-2xl text-white flex flex-col justify-between ring-1 ring-white/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    05
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Competitive Tier Ranks
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Climb ranks from Bronze to Overlord by logging verified focus hours and dominating leaderboards.
                </p>
              </div>
            </motion.div>

          </div>

        </motion.div>

        {/* ── LEFT SHUTTER (z-40): Canvas Stage & 4 Floating Cards ── */}
        <motion.div
          style={{ x: leftCurtainX }}
          className="absolute top-0 left-0 w-full md:w-1/2 h-full bg-[#070B14] shadow-2xl z-40 flex items-center justify-center overflow-hidden"
        >
          {/* Full-Bleed Canvas */}
          <canvas
            ref={sineCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Glassmorphic 4 Cards Stage */}
          <div className="relative z-20 w-full max-w-md px-4 flex items-center justify-center">
            
            {/* CARD 1: COMPETITION */}
            <motion.div
              style={{
                opacity: c1Opacity,
                x: card1Pos.x,
                y: card1Pos.y,
              }}
              className="absolute w-[92%] sm:w-[380px] bg-white/40 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-[#FF5500]/40 overflow-hidden space-y-2.5"
            >
              <h4
                className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
              >
                Competition
              </h4>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-normal text-slate-800">
                Battle peer fighters in 1v1 focus match duels where live camera sync and timer tracking prove who maintains flow state under pressure.
              </p>
            </motion.div>

            {/* CARD 2: REAL SQUAD ACCOUNTABILITY */}
            <motion.div
              style={{
                opacity: c2Opacity,
                x: card2Pos.x,
                y: card2Pos.y,
              }}
              className="absolute w-[92%] sm:w-[380px] bg-white/40 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-[#FF5500]/40 overflow-hidden space-y-2.5"
            >
              <h4
                className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
              >
                Real Squad Accountability
              </h4>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-normal text-slate-800">
                Join live multiplayer study rooms where peer presence, real-time focus logs, and synchronized sprint timers keep everyone locked in without distraction.
              </p>
            </motion.div>

            {/* CARD 3: STAKES */}
            <motion.div
              style={{
                opacity: c3Opacity,
                x: card3Pos.x,
                y: card3Pos.y,
              }}
              className="absolute w-[92%] sm:w-[380px] bg-white/40 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-[#FF5500]/40 overflow-hidden space-y-2.5"
            >
              <h4
                className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
              >
                Stakes
              </h4>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-normal text-slate-800">
                Stake cash on your study sessions in 1v1 duels or squad pools, earning verified payouts directly to your wallet when you complete your targets.
              </p>
            </motion.div>

            {/* CARD 4: UNSTOPPABLE SPORT */}
            <motion.div
              style={{
                opacity: c4Opacity,
                x: card4Pos.x,
                y: card4Pos.y,
              }}
              className="absolute w-[92%] sm:w-[380px] bg-white/40 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-[#FF5500]/40 overflow-hidden space-y-2.5"
            >
              <h4
                className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
              >
                Unstoppable Sport
              </h4>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-normal text-slate-800">
                Level up tier ranks from Bronze to Overlord by logging verified focus hours, turning daily study discipline into an addictive competitive sport.
              </p>
            </motion.div>

          </div>
        </motion.div>

        {/* ── RIGHT SHUTTER (z-40): Solitary Study text ── */}
        <motion.div
          style={{ x: rightCurtainX }}
          className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-[#070B14] shadow-2xl z-40 flex items-center justify-center p-6 md:p-14 overflow-hidden"
        >
          <div className="max-w-lg space-y-6 text-left">
            <div className="space-y-3">
              <h2
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FFFFFF' }}
              >
                Solitary Study <br />
                <span className="italic font-serif font-normal" style={{ color: '#FFFFFF' }}>is Dead.</span>
              </h2>

              <h3
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]"
                style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
              >
                Welcome to the Arena.
              </h3>
            </div>

            <p className="text-base sm:text-lg leading-relaxed font-medium" style={{ color: '#FFFFFF' }}>
              Willpower alone fails.{' '}
              <span className="font-extrabold" style={{ color: '#FF5500' }}>Competition</span>,{' '}
              <span className="font-extrabold" style={{ color: '#FF5500' }}>real squad accountability</span>, and{' '}
              <span className="font-extrabold" style={{ color: '#FF5500' }}>stakes</span>{' '}
              turn focus into an{' '}
              <span className="font-extrabold" style={{ color: '#FF5500' }}>unstoppable sport.</span>
            </p>
          </div>
        </motion.div>

      </div>

    </div>
  );
}
