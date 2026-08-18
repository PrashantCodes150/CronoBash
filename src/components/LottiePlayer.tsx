"use client";

import React, { useEffect, useRef } from 'react';

interface LottiePlayerProps {
  animationData?: any;
  src?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
}

// Global module singleton cache so lottie-web engine is imported ONLY ONCE
let lottieModulePromise: Promise<any> | null = null;
const getLottieWeb = () => {
  if (!lottieModulePromise) {
    lottieModulePromise = import('lottie-web').then(m => m.default);
  }
  return lottieModulePromise;
};

// In-memory JSON cache so fetch() requests for .json files are executed only once and reused instantly
const lottieJsonCache = new Map<string, any>();

async function fetchLottieJson(url: string): Promise<any> {
  if (lottieJsonCache.has(url)) {
    return lottieJsonCache.get(url);
  }
  const promise = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      lottieJsonCache.set(url, data);
      return data;
    });
  return promise;
}

export default function LottiePlayer({
  animationData,
  src,
  className = "w-full h-full",
  loop = true,
  autoplay = true,
  speed = 1,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initLottie() {
      try {
        const targetSrc = animationData ? null : (src || '/lottie/Education.json');

        // Parallel fetch of Lottie Engine + Animation JSON
        const [lottie, data] = await Promise.all([
          getLottieWeb(),
          animationData ? Promise.resolve(animationData) : fetchLottieJson(targetSrc!)
        ]);

        if (!isMounted || !containerRef.current) return;

        if (animRef.current) {
          animRef.current.destroy();
        }

        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          animationData: data,
          rendererSettings: {
            progressiveLoad: true,
            preserveAspectRatio: 'xMidYMid meet',
          }
        });

        if (speed && animRef.current) {
          animRef.current.setSpeed(speed);
        }
      } catch (err) {
        console.error('Failed to load Lottie animation:', err);
      }
    }

    initLottie();

    return () => {
      isMounted = false;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationData, src, loop, autoplay, speed]);

  return <div ref={containerRef} className={className} />;
}
