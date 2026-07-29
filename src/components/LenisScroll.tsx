"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function LenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let lenis: Lenis;

    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
      });

      lenis.on('scroll', () => {
        const scrollProgress = document.getElementById('scroll-progress');
        if (scrollProgress && lenis) {
          const progress = lenis.progress || 0;
          scrollProgress.style.transform = `scaleX(${progress})`;
        }
      });

      function raf(time: number) {
        if (lenis) {
          lenis.raf(time);
        }
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
      lenisRef.current = lenis;
    } catch {
      return;
    }

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, []);

  return null;
}