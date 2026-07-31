"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface TurnStudyIntoASportHeroProps {
  frames: string[];
  user?: any;
}

export default function TurnStudyIntoASportHero({ frames, user }: TurnStudyIntoASportHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Track scroll progress through the pinned Hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Ultra-Smooth Elastic Inertia Spring Physics (Apple-grade fluid motion)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    mass: 0.25,
    restDelta: 0.0001,
  });

  // Preload and async-decode frame images for zero-lag GPU execution
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const loadedSet = new Set<number>();
    const imgArray: HTMLImageElement[] = [];

    frames.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      
      const onImageReady = () => {
        if (loadedSet.has(idx)) return;
        loadedSet.add(idx);

        if (idx === 0 || loadedSet.size >= 1) {
          setImagesLoaded(true);
        }
      };

      img.onload = onImageReady;
      if (typeof img.decode === 'function') {
        img.decode().then(onImageReady).catch(() => {});
      }

      imgArray[idx] = img;
    });

    loadedImagesRef.current = imgArray;
  }, [frames]);

  // Ultra-Smooth Sub-Frame Alpha Interpolation Render Loop
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

      // Enable high quality bi-linear image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const total = loadedImagesRef.current.length;

      if (total > 0) {
        // Calculate precise fractional float frame index (e.g. 42.6)
        const floatFrame = progress * (total - 1);
        const idx1 = Math.floor(floatFrame);
        const idx2 = Math.min(total - 1, idx1 + 1);
        const blend = floatFrame - idx1; // Sub-frame interpolation ratio [0..1]

        let targetIdx1 = idx1;
        while (targetIdx1 > 0 && (!loadedImagesRef.current[targetIdx1] || !loadedImagesRef.current[targetIdx1].complete)) {
          targetIdx1--;
        }

        const img1 = loadedImagesRef.current[targetIdx1] || loadedImagesRef.current[0];
        const img2 = loadedImagesRef.current[idx2];

        // Draw Base Frame (idx1)
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

          // Sub-Frame Blend Transition with Next Frame (idx2) for 120fps motion morphing
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

  // Smooth fade out of text content as user reaches the end of the hero scroll sequence
  const opacityFade = useTransform(smoothProgress, [0.75, 0.95], [1, 0]);

  return (
    <div ref={containerRef} id="hero" className="relative h-[450vh] w-full bg-[#ECEFF6]">
      
      {/* Sticky Full-Screen Hero Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pt-16">
        
        {/* Instant MP4 Video Background Fallback for Vercel CDN */}
        <video
          src="/videos/generate_this_video_in_hd_in_gwr_video_mvp.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        />

        {/* Full Bleed Background Frame Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Soft Vignette Overlay for Crisp Typography Readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#ECEFF6]/95 via-[#ECEFF6]/75 to-transparent pointer-events-none" />

        {/* Hero Content Container */}
        <motion.div
          style={{ opacity: opacityFade }}
          className="relative z-20 max-w-[1440px] mx-auto px-5 md:px-16 w-full flex flex-col justify-center items-start pointer-events-auto"
        >
          {/* Main Hero Copy */}
          <div className="flex flex-col gap-6 sm:gap-8 max-w-2xl">
            
            <h1
              className="text-[38px] sm:text-[52px] md:text-[68px] lg:text-[80px] text-[#334155] tracking-normal leading-[1.04] font-extrabold"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Turn <span style={{ color: '#FF5500' }}>Study</span> <br />
              <span className="text-slate-500/80 italic font-serif font-normal">Into a</span> <span style={{ color: '#FF5500' }}>Sport</span>.
            </h1>

            <p className="text-lg sm:text-xl leading-[32px] text-[#44474c] max-w-lg font-normal">
              CronoBash is a multiplayer focus arena where study sprints, squad rooms, cash stakes, and duels keep your momentum unstoppable.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-5 pt-2">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="bg-gradient-to-r from-[#334155] to-[#0f172a] text-white px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-xl shadow-[#334155]/20 flex items-center gap-2 group"
              >
                Start a Sprint
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <a
                href="#bento"
                className="bg-white/80 backdrop-blur-md border border-white/90 text-[#334155] px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:bg-white active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">motion_photos_on</span>
                Explore Features
              </a>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}
