"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="font-medium uppercase tracking-[0.04em] text-[#1a1a1a] hover:opacity-55 transition-opacity text-[14px]"
    >
      {label}
    </a>
  );
}

export default function Hero() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays programmatically to bypass browser autoplay restrictions
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Hero video autoplay prevented:", err);
      });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Blur background when scrolled down past 20px
      if (currentScrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Apple-like hide on scroll down, show on scroll up
      if (currentScrollY > 80 && currentScrollY > lastScrollY.current) {
        setIsVisible(false); // Scrolling DOWN -> Hide Navbar
      } else {
        setIsVisible(true);  // Scrolling UP -> Show Navbar
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Apple-Style Smart Navbar (Hides on Scroll Down, Reappears on Scroll Up) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } ${
          isScrolled
            ? 'bg-[#fcf9f8]/80 backdrop-blur-md border-b border-surface-variant/50 shadow-xs'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="w-full max-w-[1360px] mx-auto flex items-center justify-between px-6 py-3.5 md:px-16 md:py-4">
          {/* Wordmark */}
          <Link href="/" className="select-none">
            <span
              className="text-[28px] text-black leading-none select-none"
              style={{ fontFamily: '"Special Elite", serif', fontWeight: 400 }}
            >
              CronoBash
            </span>
          </Link>

          {/* Center Nav — Mapped to Landing Page Sections */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            <NavLink label="Features" href="#features" />
            <NavLink label="1v1 Duels" href="#stakes" />
            <NavLink label="Mastery Tiers" href="#levels" />
            <NavLink label="FAQ" href="#faq" />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hidden md:block font-semibold uppercase tracking-[0.04em] text-[#1a1a1a] text-[14px] hover:opacity-55 transition-opacity"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="bg-[#1a1a1a] text-white rounded-full px-5 py-2.5 font-medium text-[13px] uppercase tracking-[0.04em] hover:bg-[#333] active:scale-95 transition-all duration-200"
            >
              Start Sprint
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: '100svh', minHeight: '600px' }}
      >
        {/* Background video */}
        <video
          ref={videoRef}
          src="/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Subtle Gradient overlay (Ensures video is 100% visible while text remains high contrast) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/50 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-black/15 z-10 pointer-events-none" />

        {/* Content */}
        <div suppressHydrationWarning={true} className="relative z-20 w-full max-w-[1200px] mx-auto px-6 md:px-16 flex flex-col items-center text-center pt-32 md:pt-36 reveal">
          <h1
            className="text-[clamp(36px,6vw,60px)] text-[#0a0a0a] mb-5 max-w-4xl leading-[1.08] tracking-[-0.04em]"
            style={{ fontWeight: 500 }}
          >
            Turn Study into a Sport
          </h1>

          <p className="text-[17px] md:text-[19px] leading-[28px] text-on-surface-variant max-w-2xl mb-10 font-normal">
            Join elite study squads, earn rewards, and achieve absolute focus in the immersive CronoBash arena.
          </p>

          {/* Liquid Glass Prompt / Search Card */}
          <div className="liquid-glass rounded-2xl p-2 pl-6 flex items-center w-full max-w-2xl mx-auto shadow-xl">
            <Search className="w-5 h-5 text-outline shrink-0 mr-3" />
            <input
              type="text"
              placeholder="What are we focusing on today?..."
              suppressHydrationWarning={true}
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-[16px] leading-[24px] placeholder:text-outline-variant outline-none font-sans"
            />
            <Link
              href="/dashboard"
              className="bg-[#0a0a0a] text-white rounded-xl px-6 py-3 ml-4 text-[12px] font-semibold uppercase tracking-[0.05em] hover:opacity-55 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              Start Session
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
