"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useFramePreloader } from '@/hooks/useFramePreloader';

interface ScrollVideoCanvasProps {
  /** Optional array of image frame URLs */
  frames?: string[];
  /** Optional video URL for video-driven scrollytelling */
  videoSrc?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
}

export default function ScrollVideoCanvas({
  frames = [],
  videoSrc = '',
  title = 'CYBERNETIC FOCUS ARENA',
  subtitle = 'SCROLL TO EXPLORE THE ARENA IN MOTION'
}: ScrollVideoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentFrameIndexRef = useRef(0);

  // Track scroll progress within pinned container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const { loadedImagesRef, getFrameOrFallback } = useFramePreloader(frames, {
    enabled: true,
    concurrency: 12,
    priorityCount: 10,
  });

  // 2. Render Loop on Scroll Update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const progress = smoothProgress.get();
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // MODE A: Image Sequence Frames
      if (loadedImagesRef.current.length > 0) {
        const totalFrames = loadedImagesRef.current.length;
        const frameIndex = Math.min(
          totalFrames - 1,
          Math.max(0, Math.floor(progress * (totalFrames - 1)))
        );

        currentFrameIndexRef.current = frameIndex;
        const img = getFrameOrFallback(frameIndex);

        if (img && img.complete) {
          // Draw image centered aspect-fit/cover
          const hRatio = width / img.width;
          const vRatio = height / img.height;
          const ratio = Math.max(hRatio, vRatio);
          const drawW = Math.round(img.width * ratio);
          const drawH = Math.round(img.height * ratio);
          const centerShift_x = Math.round((width - drawW) / 2);
          const centerShift_y = Math.round((height - drawH) / 2);

          ctx.drawImage(
            img,
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, drawW, drawH
          );
        }
      } 
      // MODE B: Video Element Scrollytelling
      else if (videoRef.current && videoRef.current.duration) {
        const video = videoRef.current;
        video.currentTime = progress * video.duration;
        try {
          ctx.drawImage(video, 0, 0, width, height);
        } catch (e) {}
      } 
      // MODE C: Interactive 3D Cyberpunk Procedural Mesh Fallback
      else {
        drawProcedural3DMesh(ctx, width, height, progress);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [smoothProgress]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fallback Procedural 3D Mesh
  const drawProcedural3DMesh = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
  ) => {
    const time = progress * Math.PI * 4;
    const centerX = width / 2;
    const centerY = height / 2;

    const bgGradient = ctx.createRadialGradient(
      centerX, centerY, 50,
      centerX, centerY, Math.max(width, height) / 1.2
    );
    bgGradient.addColorStop(0, '#0F172A');
    bgGradient.addColorStop(0.5, '#090D16');
    bgGradient.addColorStop(1, '#030712');

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const numRings = 16;
    ctx.lineWidth = 1.5;

    for (let i = 1; i <= numRings; i++) {
      const radius = (i / numRings) * (Math.min(width, height) * 0.45);
      const angleOffset = time * (i % 2 === 0 ? 0.5 : -0.5);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + Math.sin(time + i * 0.2) * 20,
        radius,
        radius * (0.35 + Math.cos(time * 0.5 + i * 0.1) * 0.15),
        angleOffset,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle = i % 3 === 0 
        ? `rgba(59, 130, 246, ${0.15 + (i / numRings) * 0.25})`
        : i % 2 === 0
        ? `rgba(16, 185, 129, ${0.12 + (i / numRings) * 0.2})`
        : `rgba(139, 92, 246, ${0.15 + (i / numRings) * 0.2})`;

      ctx.stroke();
      ctx.restore();
    }
  };

  const titleOpacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);
  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);

  return (
    <div ref={containerRef} className="relative h-[250vh] w-full bg-slate-950">
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          preload="auto"
          muted
          playsInline
          className="hidden"
        />
      )}

      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <motion.div
          style={{ opacity: titleOpacity, scale: titleScale }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-4 pointer-events-none select-none"
        >
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-[#3B82F6] bg-blue-950/60 border border-blue-500/30 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
            SCROLL-TRIGGERED 3D CINEMATIC
          </span>

          <h2
            className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight uppercase leading-tight font-mono drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {title}
          </h2>

          <p className="text-xs sm:text-base font-mono text-slate-300 tracking-widest uppercase font-bold max-w-xl mx-auto drop-shadow-md">
            {subtitle}
          </p>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
      </div>
    </div>
  );
}

/** ── HERO SECTION SCROLL-DRIVEN 3D FRAME CANVAS ── */
export function HeroFrameCanvas({ frames }: { frames: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);

  // Hook scroll progress targeting the window/hero container
  const { scrollYProgress } = useScroll({
    offset: ['start start', 'end start']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 25,
    restDelta: 0.001
  });

  // Preload frames
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const imgArray: HTMLImageElement[] = [];
    frames.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      imgArray[idx] = img;
    });
    loadedImagesRef.current = imgArray;
  }, [frames]);

  // Render on scroll update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const progress = Math.min(1, Math.max(0, smoothProgress.get()));
      
      if (loadedImagesRef.current.length > 0) {
        const total = loadedImagesRef.current.length;
        const frameIdx = Math.min(total - 1, Math.floor(progress * (total - 1)));
        currentFrameRef.current = frameIdx;

        const img = loadedImagesRef.current[frameIdx];

        if (img && img.complete) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const hRatio = w / img.width;
          const vRatio = h / img.height;
          const ratio = Math.max(hRatio, vRatio);
          const shiftX = (w - img.width * ratio) / 2;
          const shiftY = (h - img.height * ratio) / 2;

          ctx.drawImage(
            img, 0, 0, img.width, img.height,
            shiftX, shiftY, img.width * ratio, img.height * ratio
          );
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth || 550;
      canvas.height = canvas.clientHeight || 550;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [smoothProgress]);

  return (
    <div ref={containerRef} className="relative w-full h-[480px] sm:h-[580px] rounded-3xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-slate-900 group">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Live Badge Overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-white/90 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-md z-20">
        <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
        <span className="text-[11px] font-mono font-bold text-[#334155] uppercase tracking-wider">
          3D DESK TIMER • SCROLL TO CONTROL
        </span>
      </div>

      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white border border-white/20 px-3.5 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider z-20 flex items-center gap-2">
        <span className="material-symbols-outlined text-xs text-[#FF5500]">mouse</span>
        <span>SCROLL FRAME ANIMATION</span>
      </div>
    </div>
  );
}
