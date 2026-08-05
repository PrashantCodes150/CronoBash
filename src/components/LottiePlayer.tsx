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
  const safeSpeed = speed ?? 1;

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initLottie() {
      try {
        const lottie = (await import('lottie-web')).default;
        if (!isMounted || !containerRef.current) return;

        // Destroy previous animation if exists
        if (animRef.current) {
          animRef.current.destroy();
        }

        let animationConfig: any = {
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
        };

        if (animationData) {
          animationConfig.animationData = animationData;
        } else if (src) {
          animationConfig.path = src;
        } else {
          animationConfig.path = '/lottie/education.json';
        }

        animRef.current = lottie.loadAnimation(animationConfig);
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
  }, [animationData, src, loop, autoplay, safeSpeed]);

  return <div ref={containerRef} className={className} />;
}
