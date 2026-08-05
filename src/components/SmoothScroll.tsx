"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Official Lenis Website Smooth Inertia Configuration (duration: 1.5s momentum)
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential decay curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.8,
      infinite: false,
    });

    if (typeof window !== 'undefined') {
      (window as any).lenis = lenis;
    }

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Feed Lenis RAF directly into GSAP Ticker for frame-perfect 60Hz/120Hz/144Hz sync
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Global scroll reveal observer for .reveal elements
    function revealOnScroll() {
      const elements = document.querySelectorAll<HTMLElement>('.reveal');
      const windowHeight = window.innerHeight;
      elements.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < windowHeight - 80) {
          el.classList.add('active');
        }
      });
    }

    lenis.on('scroll', revealOnScroll);
    revealOnScroll();

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerUpdate);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Reset scroll and refresh GSAP ScrollTrigger on route change
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lenis) {
      (window as any).lenis.scrollTo(0, { immediate: true });
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    }
  }, [pathname]);

  return <>{children}</>;
}
