"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Interactive3dCtaCardProps {
  user?: any;
}

export default function Interactive3dCtaCard({ user }: Interactive3dCtaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Smooth mouse coordinates relative to card [0 .. 1]
  const targetMouseX = useRef(0.5);
  const targetMouseY = useRef(0.5);
  
  const currentMouseX = useRef(0.5);
  const currentMouseY = useRef(0.5);
  const currentProgress = useRef(0);
  const isHovered = useRef(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const my = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    targetMouseX.current = mx;
    targetMouseY.current = my;
    isHovered.current = true;
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
  };

  // Preload and decode all 220 3D workflow animation frames
  useEffect(() => {
    const totalFrames = 220;
    const loadedSet = new Set<number>();
    const imgArray: HTMLImageElement[] = [];

    for (let i = 1; i <= totalFrames; i++) {
      const idx = i - 1;
      const src = `/workflow-frames/frame_${String(i).padStart(3, '0')}.jpg`;
      const img = new Image();
      const onImageReady = () => {
        if (loadedSet.has(idx)) return;
        loadedSet.add(idx);

        if (idx === 0 || loadedSet.size >= 1) {
          setImagesLoaded(true);
        }
      };

      img.onload = onImageReady;
      img.onerror = onImageReady;
      img.src = src;

      if ('decode' in img && typeof (img as any).decode === 'function') {
        (img as any).decode().catch(() => {});
      }

      imgArray[idx] = img;
    }

    loadedImagesRef.current = imgArray;
  }, []);

  // 120fps Sub-Frame Interpolated 3D Video Canvas Loop + Parallax Mouse Tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let autoPlayTime = 0;

    const render = () => {
      autoPlayTime += 0.003;

      // Smooth interpolation for mouse position
      currentMouseX.current += (targetMouseX.current - currentMouseX.current) * 0.08;
      currentMouseY.current += (targetMouseY.current - currentMouseY.current) * 0.08;

      // If hovered, combine X & Y mouse movement for 2D scrubbing; else auto-play pendulum
      let targetP = targetMouseX.current;
      if (isHovered.current) {
        targetP = targetMouseX.current * 0.65 + targetMouseY.current * 0.35;
      } else {
        targetP = (Math.sin(autoPlayTime) + 1) / 2;
      }

      currentProgress.current += (targetP - currentProgress.current) * 0.08;

      const progress = Math.min(1, Math.max(0, currentProgress.current));
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
          // Slight 8% zoom ratio to allow mouse-following parallax shift without clipping edges
          const hRatio = width / img1.width;
          const vRatio = height / img1.height;
          const ratio = Math.max(hRatio, vRatio) * 1.08;

          // Parallax Mouse Following Shift (3D Video Object follows cursor)
          const mouseShiftX = (currentMouseX.current - 0.5) * 55;
          const mouseShiftY = (currentMouseY.current - 0.5) * 40;

          const shiftX = (width - img1.width * ratio) / 2 + mouseShiftX;
          const shiftY = (height - img1.height * ratio) / 2 + mouseShiftY;

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth || cardRef.current?.clientWidth || 900;
      const displayHeight = canvas.clientHeight || cardRef.current?.clientHeight || 450;

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

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Stable Card Box (No 3D tilting/moving outer box!) */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-3xl p-8 sm:p-14 md:p-20 bg-[#070B14] text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden text-center border border-slate-800/80 transition-all duration-300 select-none"
      >
        {/* Full Bleed 3D Video Canvas (Mouse moves & follows cursor in 2D/3D parallax!) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-80"
        />

        {/* Dark Glass Vignette Gradient Overlay for Crisp Readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#070B14]/90 via-[#070B14]/70 to-[#070B14]/90 pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-20 space-y-6 sm:space-y-8">
          
          <h2
            className="text-[32px] sm:text-[48px] md:text-[64px] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-2xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Ready to Turn <span style={{ color: '#FF5500' }}>Study</span> Into a <span style={{ color: '#FF5500' }}>Sport</span>?
          </h2>

          <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg">
            Join thousands of scholars in the arena. Create your account in under 30 seconds and start your first focus sprint today.
          </p>

          <div className="flex justify-center gap-3 sm:gap-4 pt-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="bg-white text-[#070B14] px-8 sm:px-12 py-4 sm:py-5 rounded-full text-sm sm:text-base font-extrabold uppercase tracking-wider transition-all duration-300 hover:scale-[1.06] hover:bg-[#FF5500] hover:text-white shadow-2xl flex items-center gap-2.5 group"
            >
              Start Your First Sprint
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform text-[#FF5500] group-hover:text-white">
                arrow_forward
              </span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
