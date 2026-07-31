"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BADGES } from '@/lib/badges';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Climb100TiersMasteryHeroProps {
  frames: string[];
}

export default function Climb100TiersMasteryHero({ frames }: Climb100TiersMasteryHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const currentFrameObjRef = useRef({ frame: 0 });

  // Pin section for 240vh for smooth scroll-driven video frames transition + right-to-left emblem scrollytelling
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Snappy, 1-to-1 Lenis scroll spring tracking
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 48,
    mass: 0.08,
    restDelta: 0.0001,
  });

  // Preload frames into image cache with robust fallback handling
  useEffect(() => {
    if (frames.length === 0) return;

    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    const handleReady = () => {
      loadedCount++;
      if (loadedCount >= frames.length) {
        setImagesLoaded(true);
      }
    };

    frames.forEach((src, idx) => {
      const img = new Image();
      img.onload = handleReady;
      img.onerror = handleReady;
      img.src = src;

      if ('decode' in img && typeof (img as any).decode === 'function') {
        (img as any).decode().catch(() => {});
      }

      imgArray[idx] = img;
    });

    setImages(imgArray);
  }, [frames]);

  // ── GSAP & LENIS SMOOTH VIDEO FRAME SCRUBBING ──
  useEffect(() => {
    if (!containerRef.current || frames.length === 0) return;

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        const targetFrame = p * (frames.length - 1);
        gsap.to(currentFrameObjRef.current, {
          frame: targetFrame,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      },
    });

    return () => st.kill();
  }, [frames.length]);

  // Draw current frame on canvas with sub-frame blend interpolation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const total = images.length;
      if (total > 0) {
        const floatFrame = Math.max(0, Math.min(total - 1, currentFrameObjRef.current.frame));
        const idx1 = Math.floor(floatFrame);
        const idx2 = Math.min(total - 1, idx1 + 1);
        const blend = floatFrame - idx1;

        const img1 = images[idx1];
        const img2 = images[idx2];

        if (img1 && img1.complete && img1.naturalWidth > 0 && img1.naturalHeight > 0) {
          const w = canvas.width;
          const h = canvas.height;

          ctx.clearRect(0, 0, w, h);

          const imgRatio = img1.naturalWidth / img1.naturalHeight;
          const canvasRatio = w / h;
          let drawW = w;
          let drawH = h;
          let offsetX = 0;
          let offsetY = 0;

          if (canvasRatio > imgRatio) {
            drawH = w / imgRatio;
            offsetY = (h - drawH) / 2;
          } else {
            drawW = h * imgRatio;
            offsetX = (w - drawW) / 2;
          }

          ctx.globalAlpha = 1.0;
          ctx.drawImage(img1, offsetX, offsetY, drawW, drawH);

          if (idx1 !== idx2 && img2 && img2.complete && img2.naturalWidth > 0 && blend > 0.005) {
            ctx.globalAlpha = blend;
            ctx.drawImage(img2, offsetX, offsetY, drawW, drawH);
          }

          // Light, subtle vignette overlay for text legibility
          ctx.globalAlpha = 1.0;
          const gradient = ctx.createLinearGradient(0, 0, 0, h);
          gradient.addColorStop(0, 'rgba(7, 11, 20, 0.25)');
          gradient.addColorStop(0.5, 'rgba(7, 11, 20, 0.15)');
          gradient.addColorStop(1, 'rgba(7, 11, 20, 0.35)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [imagesLoaded, images]);

  // ── Left Column Header Motion ──
  const headerOpacity = useTransform(smoothProgress, [0, 0.05, 0.95, 1.0], [0.6, 1, 1, 0.6]);

  // ── RIGHT-TO-LEFT EMBLEM TRANSITIONS ──
  const b1X = useTransform(smoothProgress, [0.02, 0.08, 0.26, 0.30], ['120%', '0%', '0%', '-120%']);
  const b1Opacity = useTransform(smoothProgress, [0.02, 0.08, 0.26, 0.30], [0, 1, 1, 0]);

  const b2X = useTransform(smoothProgress, [0.28, 0.33, 0.51, 0.55], ['120%', '0%', '0%', '-140%']);
  const b2Opacity = useTransform(smoothProgress, [0.28, 0.33, 0.51, 0.55], [0, 1, 1, 0]);

  const b3X = useTransform(smoothProgress, [0.53, 0.58, 0.76, 0.80], ['120%', '0%', '0%', '-140%']);
  const b3Opacity = useTransform(smoothProgress, [0.53, 0.58, 0.76, 0.80], [0, 1, 1, 0]);

  const b4X = useTransform(smoothProgress, [0.78, 0.84, 1.00], ['120%', '0%', '0%']);
  const b4Opacity = useTransform(smoothProgress, [0.78, 0.84, 1.00], [0, 1, 1]);

  const tiers = [
    {
      tier: 'BRONZE TIER',
      title: 'Bronze Scholar',
      xp: '1,000 XP',
      badgeIndex: 0,
      colorHex: '#F59E0B',
      glow: 'drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]'
    },
    {
      tier: 'SILVER TIER',
      title: 'Silver Strategist',
      xp: '8,500 XP',
      badgeIndex: 24,
      colorHex: '#67E8F9',
      glow: 'drop-shadow-[0_0_35px_rgba(103,232,249,0.6)]'
    },
    {
      tier: 'GOLD TIER',
      title: 'Gold Flow Titan',
      xp: '34,000 XP',
      badgeIndex: 49,
      colorHex: '#FACC15',
      glow: 'drop-shadow-[0_0_35px_rgba(234,179,8,0.6)]'
    },
    {
      tier: 'OVERLORD TIER',
      title: 'Arena Overlord',
      xp: '120,000 XP',
      badgeIndex: 99,
      colorHex: '#FF5500',
      glow: 'drop-shadow-[0_0_40px_rgba(255,85,0,0.7)]'
    },
  ];

  const motionStates = [
    { x: b1X, opacity: b1Opacity },
    { x: b2X, opacity: b2Opacity },
    { x: b3X, opacity: b3Opacity },
    { x: b4X, opacity: b4Opacity },
  ];

  return (
    <div ref={containerRef} id="levels" className="relative h-[240vh] w-full bg-[#070B14]">
      
      {/* Sticky Full-Screen Viewport Pinned while Video Frames Pan */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center py-10">
        
        {/* Scroll Video Canvas Background (100% VISIBLE & BRIGHT) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        />

        {/* Content Stage */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 md:px-16 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* ── LEFT COLUMN: Title Hierarchy ── */}
            <motion.div
              style={{ opacity: headerOpacity }}
              className="lg:col-span-5 space-y-4 text-left relative p-2"
            >
              {/* Soft Black Faded Glow Vignette Behind Text Only */}
              <div className="absolute -inset-6 bg-gradient-to-r from-black/60 via-black/30 to-transparent blur-2xl -z-10 pointer-events-none rounded-full" />

              <div className="space-y-2">
                <h2
                  className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] uppercase drop-shadow-md"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#FFFFFF' }}
                >
                  Unlock Mastery <br />
                  <span className="italic font-serif font-normal lowercase" style={{ color: '#FFFFFF' }}>emblem</span>
                </h2>

                <h3
                  className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] uppercase drop-shadow-md"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#FF5500' }}
                >
                  Badges.
                </h3>
              </div>

              <p
                className="text-base sm:text-xl leading-relaxed tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] font-semibold pt-2 max-w-md"
                style={{ color: '#FFFFFF', fontFamily: "'Dancing Script', 'Edu NSW ACT Cursive', cursive" }}
              >
                Prove daily focus discipline. Every sprint earns XP, evolving your emblem identity as you rise to undisputed Overlord.
              </p>
            </motion.div>

            {/* ── RIGHT COLUMN: Raw Vector Emblems Stage ── */}
            <div className="lg:col-span-7 relative h-[360px] sm:h-[340px] flex items-center justify-center">
              
              {tiers.map((t, idx) => {
                const badge = BADGES[t.badgeIndex] || BADGES[0];
                const motionState = motionStates[idx];

                return (
                  <motion.div
                    key={t.tier}
                    style={{
                      x: motionState.x,
                      opacity: motionState.opacity,
                    }}
                    className="absolute flex flex-col items-center justify-center p-4 transition-transform duration-300 hover:scale-110 z-20"
                  >
                    {/* Pure Raw Vector Emblem Badge */}
                    <div className={t.glow}>
                      <BadgeDisplay badge={badge} size="xl" isUnlocked={true} />
                    </div>
                  </motion.div>
                );
              })}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
