"use client";

import React, { useEffect, useRef, useState } from 'react';

interface LottiePlayerProps {
  animationData?: any;
  src?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  priority?: boolean;
}

// Global module singleton cache so lightweight SVG Lottie engine is imported ONLY ONCE
let lottieLightPromise: Promise<any> | null = null;
const getLottieLight = () => {
  if (!lottieLightPromise) {
    lottieLightPromise = import('lottie-web/build/player/lottie_light.min.js').then(
      m => m.default || m
    );
  }
  return lottieLightPromise;
};

// In-memory JSON cache so fetch() requests for .json files are executed only once and reused instantly
const lottieJsonCache = new Map<string, any>();

async function fetchLottieJson(url: string): Promise<any> {
  if (lottieJsonCache.has(url)) {
    return lottieJsonCache.get(url);
  }
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  lottieJsonCache.set(url, data);
  return data;
}

export default function LottiePlayer({
  animationData,
  src,
  className = "w-full h-full",
  loop = true,
  autoplay = true,
  speed = 1,
  priority = false,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    if (priority || isVisible) return;
    if (!containerRef.current) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  // Pause / resume when scrolling into / out of view to preserve 60FPS performance
  useEffect(() => {
    if (!containerRef.current || !animRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (animRef.current) {
          if (entry.isIntersecting && autoplay) {
            animRef.current.play();
          } else {
            animRef.current.pause();
          }
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isLoaded, autoplay]);

  // Main animation loader
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    let isMounted = true;

    async function initLottie() {
      try {
        const targetSrc = animationData ? null : (src || '/lottie/student.json');

        // Parallel fetch of lightweight Lottie Engine + Animation JSON
        const [lottie, data] = await Promise.all([
          getLottieLight(),
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

        if (isMounted) {
          setIsLoaded(true);
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
  }, [isVisible, animationData, src, loop, autoplay, speed]);

  return (
    <div
      ref={containerRef}
      className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
