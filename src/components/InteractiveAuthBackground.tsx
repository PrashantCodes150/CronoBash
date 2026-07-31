"use client";

import React, { useEffect, useRef, useState } from 'react';

interface InteractiveAuthBackgroundProps {
  totalFrames?: number;
}

export default function InteractiveAuthBackground({ totalFrames = 220 }: InteractiveAuthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Smooth lerp tracking for mouse position and video scrubbing
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    frame: 0,
    targetFrame: 0,
  });

  // Preload frames
  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    const handleReady = () => {
      loadedCount++;
      if (loadedCount >= totalFrames) {
        setImagesLoaded(true);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const filename = `/auth-frames/frame_${String(i).padStart(3, '0')}.jpg`;
      img.onload = handleReady;
      img.onerror = handleReady;
      img.src = filename;

      if ('decode' in img && typeof (img as any).decode === 'function') {
        (img as any).decode().catch(() => {});
      }

      imgArray.push(img);
    }

    setImages(imgArray);
  }, [totalFrames]);

  // Track mouse coordinates across the entire document
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;

      // Map mouse position to frame index (scrubs forward and backward based on mouse position)
      const normX = e.clientX / w;
      const normY = e.clientY / h;
      const progress = (normX * 0.7 + normY * 0.3);
      mouseRef.current.targetFrame = Math.max(0, Math.min(totalFrames - 1, progress * (totalFrames - 1)));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [totalFrames]);

  // 120FPS Smooth Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const m = mouseRef.current;

      // Smooth Lerp lerping towards target
      m.x += (m.targetX - m.x) * 0.05;
      m.y += (m.targetY - m.y) * 0.05;
      m.frame += (m.targetFrame - m.frame) * 0.08;

      const total = images.length;
      if (total > 0) {
        const floatFrame = Math.max(0, Math.min(total - 1, m.frame));
        const idx1 = Math.floor(floatFrame);
        const idx2 = Math.min(total - 1, idx1 + 1);
        const blend = floatFrame - idx1;

        const img1 = images[idx1];
        const img2 = images[idx2];

        if (img1 && img1.complete && img1.naturalWidth > 0) {
          const w = canvas.width;
          const h = canvas.height;

          ctx.clearRect(0, 0, w, h);

          // Subtle Parallax offset shifting towards mouse cursor
          const shiftX = (m.x - w / 2) * 0.04;
          const shiftY = (m.y - h / 2) * 0.04;

          const imgRatio = img1.naturalWidth / img1.naturalHeight;
          const canvasRatio = w / h;
          let drawW = w * 1.08;
          let drawH = h * 1.08;
          let offsetX = -w * 0.04;
          let offsetY = -h * 0.04;

          if (canvasRatio > imgRatio) {
            drawH = drawW / imgRatio;
            offsetY += (h - drawH) / 2;
          } else {
            drawW = drawH * imgRatio;
            offsetX += (w - drawW) / 2;
          }

          offsetX += shiftX;
          offsetY += shiftY;

          // CLEARLY VISIBLE OPACITY (0.25 for sharp, distinct video visibility while preserving card contrast)
          ctx.globalAlpha = 0.25;
          ctx.drawImage(img1, offsetX, offsetY, drawW, drawH);

          if (idx1 !== idx2 && img2 && img2.complete && img2.naturalWidth > 0 && blend > 0.005) {
            ctx.globalAlpha = 0.25 * blend;
            ctx.drawImage(img2, offsetX, offsetY, drawW, drawH);
          }

          // Interactive Cursor Spotlight Glow Effect where mouse moves
          ctx.globalAlpha = 1.0;
          const spotlight = ctx.createRadialGradient(m.x, m.y, 20, m.x, m.y, 550);
          spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
          spotlight.addColorStop(0.5, 'rgba(51, 65, 85, 0.06)');
          spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spotlight;
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
