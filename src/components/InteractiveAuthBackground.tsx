"use client";

import React, { useEffect, useRef, useState } from 'react';
import SplineSceneContainer from '@/components/SplineSceneContainer';

interface InteractiveAuthBackgroundProps {
  totalFrames?: number;
  splineSceneUrl?: string;
}

export default function InteractiveAuthBackground({ totalFrames = 220, splineSceneUrl }: InteractiveAuthBackgroundProps) {
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

  // Progressive non-blocking preloading for frames (0ms initial delay)
  useEffect(() => {
    if (splineSceneUrl) return;
    let isCancelled = false;
    const imgArray: HTMLImageElement[] = new Array(totalFrames);

    // 1. Immediately load frame 1 to render background instantly
    const firstImg = new Image();
    firstImg.src = `/auth-frames/frame_001.webp`;
    firstImg.onload = () => {
      if (isCancelled) return;
      imgArray[0] = firstImg;
      setImages([...imgArray]);
      setImagesLoaded(true);
    };

    // 2. Load remaining frames progressively in background batches
    const loadBatch = (startIndex: number, batchSize: number) => {
      if (isCancelled || startIndex >= totalFrames) return;
      const endIndex = Math.min(totalFrames, startIndex + batchSize);

      let batchLoaded = 0;
      for (let i = startIndex; i < endIndex; i++) {
        const img = new Image();
        img.src = `/auth-frames/frame_${String(i + 1).padStart(3, '0')}.webp`;
        img.onload = img.onerror = () => {
          if (isCancelled) return;
          imgArray[i] = img;
          batchLoaded++;
          if (batchLoaded >= (endIndex - startIndex)) {
            setImages([...imgArray]);
            // Schedule next batch on idle frame
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              (window as any).requestIdleCallback(() => loadBatch(endIndex, batchSize));
            } else {
              setTimeout(() => loadBatch(endIndex, batchSize), 100);
            }
          }
        };
      }
    };

    // Start background progressive load after initial render
    const timer = setTimeout(() => {
      loadBatch(1, 15);
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [totalFrames, splineSceneUrl]);

  // Track mouse coordinates
  useEffect(() => {
    if (splineSceneUrl) return;
    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;

      const normX = e.clientX / w;
      const normY = e.clientY / h;
      const progress = (normX * 0.7 + normY * 0.3);
      mouseRef.current.targetFrame = Math.max(0, Math.min(totalFrames - 1, progress * (totalFrames - 1)));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [totalFrames, splineSceneUrl]);

  // Canvas Render Loop if no Spline URL
  useEffect(() => {
    if (splineSceneUrl) return;
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

      m.x += (m.targetX - m.x) * 0.05;
      m.y += (m.targetY - m.y) * 0.05;
      m.frame += (m.targetFrame - m.frame) * 0.08;

      const total = images.length;
      if (total > 0) {
        const floatFrame = Math.max(0, Math.min(total - 1, m.frame));
        const idx1 = Math.floor(floatFrame);
        const idx2 = Math.min(total - 1, idx1 + 1);
        const blend = floatFrame - idx1;

        let img1 = images[idx1];
        let img2 = images[idx2];
        if (!img1 || !img1.complete || !img1.naturalWidth) {
          img1 = images[0];
        }

        if (img1 && img1.complete && img1.naturalWidth > 0) {
          const w = canvas.width;
          const h = canvas.height;

          ctx.clearRect(0, 0, w, h);

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

          ctx.globalAlpha = 0.25;
          ctx.drawImage(img1, offsetX, offsetY, drawW, drawH);

          if (idx1 !== idx2 && img2 && img2.complete && img2.naturalWidth > 0 && blend > 0.005) {
            ctx.globalAlpha = 0.25 * blend;
            ctx.drawImage(img2, offsetX, offsetY, drawW, drawH);
          }

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
  }, [imagesLoaded, images, splineSceneUrl]);

  if (splineSceneUrl) {
    return (
      <div className="fixed inset-0 w-full h-full pointer-events-auto z-0 opacity-40">
        <SplineSceneContainer scene={splineSceneUrl} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
