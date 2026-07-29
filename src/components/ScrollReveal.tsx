"use client";

import React, { useEffect, useRef, useState } from 'react';

type AnimationType = 'fade-up' | 'fade-left' | 'fade-right' | 'scale';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

const animationMap: Record<string, string> = {
  'fade-up': 'sr-reveal',
  'fade-left': 'sr-reveal-left',
  'fade-right': 'sr-reveal-right',
  'scale': 'sr-reveal-scale',
};

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const animationClass = animationMap[animation] || 'sr-reveal';

  return (
    <div
      ref={ref}
      className={`${animationClass} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
