"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SQUAD_FRAMES_LIST } from '@/lib/squadFramesList';

export default function BentoFeaturesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);

  // Function to draw exact frame on canvas with high-definition scaling
  const drawFrame = (frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = loadedImagesRef.current[frameIdx];
    if (img && img.complete && img.naturalWidth > 0) {
      const w = canvas.width;
      const h = canvas.height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const hRatio = w / img.width;
      const vRatio = h / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const shiftX = (w - img.width * ratio) / 2;
      const shiftY = (h - img.height * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        shiftX,
        shiftY,
        img.width * ratio,
        img.height * ratio
      );
    }
  };

  // 1. Preload 240 WebP frame images
  useEffect(() => {
    if (!SQUAD_FRAMES_LIST || SQUAD_FRAMES_LIST.length === 0) return;

    const imgArray: HTMLImageElement[] = [];
    SQUAD_FRAMES_LIST.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      if (idx === 0) {
        img.onload = () => drawFrame(0);
      }
      imgArray[idx] = img;
    });
    loadedImagesRef.current = imgArray;
  }, []);

  // 2. GSAP ScrollTrigger Pinning, Ultra-Smooth Scrubbing & Keyframe Snapping
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener('resize', handleResize);

    const ctx = gsap.context(() => {
      if (!sectionRef.current) return;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        pin: true,
        start: 'top top',
        end: '+=2000',
        scrub: 0.5, // Ultra-smooth liquid scrub inertia
        snap: {
          // Snap automatically to keyframes where cards & background are 100% sharp and clear
          snapTo: (progress) => {
            const sharpKeyframes = [0.0, 0.35, 0.70, 1.0];
            let closest = sharpKeyframes[0];
            let minDiff = Math.abs(progress - sharpKeyframes[0]);
            for (let i = 1; i < sharpKeyframes.length; i++) {
              const diff = Math.abs(progress - sharpKeyframes[i]);
              if (diff < minDiff) {
                minDiff = diff;
                closest = sharpKeyframes[i];
              }
            }
            return closest;
          },
          duration: { min: 0.2, max: 0.45 },
          delay: 0.08,
          ease: 'power2.out',
        },
        onUpdate: (self) => {
          const progress = self.progress; // 0.0 to 1.0 linear progress over pin
          const total = loadedImagesRef.current.length;
          if (total > 0) {
            const frameIdx = Math.min(total - 1, Math.floor(progress * (total - 1)));
            currentFrameRef.current = frameIdx;
            drawFrame(frameIdx);
          }
        },
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-screen bg-surface text-[#0a0a0a] z-20 border-t border-surface-variant/40 overflow-hidden"
    >
      {/* ── GSAP PINNED FULLSCREEN CANVAS (SMOOTH SCRUB + SHARP KEYFRAME SNAPPING) ── */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-between">
        
        {/* Perfectly Visible Crystal Clear Video Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Subtle Top & Bottom Gradient Edge Blends (Matches page background color #fcf9f8) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fcf9f8]/90 via-transparent to-[#fcf9f8]/90 pointer-events-none z-1" />

        {/* ── RIGHT-ALIGNED EDITORIAL CONTENT (THICK DARK TYPOGRAPHY) ── */}
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-16 flex justify-end items-center h-full pointer-events-auto">
          <div className="max-w-xl text-right space-y-5 ml-auto">

            {/* Thick High-Contrast Headline Title */}
            <h2
              className="text-[clamp(36px,5.5vw,58px)] font-black text-[#0a0a0a] tracking-tight leading-[1.04] font-sans drop-shadow-sm"
              style={{ fontWeight: 900 }}
            >
              The Arena of Focus.
            </h2>

            {/* Thick High-Contrast Subtitle / Description */}
            <p className="text-base sm:text-xl text-[#0a0a0a] font-extrabold leading-relaxed font-sans max-w-lg ml-auto drop-shadow-xs">
              A curated suite of tools designed to elevate your cognitive endurance, synchronize squad focus, and reward deep work.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
