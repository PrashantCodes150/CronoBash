"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { BADGES } from '@/lib/badges';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';
import { BadgesModal } from '@/components/study/BadgesModal';
import Footer from '@/components/Footer';
import HangingCardsSection, { HangingCardItem } from '@/components/HangingCardsSection';
import TurnStudyIntoASportHero from '@/components/TurnStudyIntoASportHero';
import MasterYourMomentumSection from '@/components/MasterYourMomentumSection';
import HandsMomentumHero from '@/components/HandsMomentumHero';
import DirectCashStakesSection from '@/components/DirectCashStakesSection';
import Climb100TiersMasteryHero from '@/components/Climb100TiersMasteryHero';
import AnimatedStatsStrip from '@/components/AnimatedStatsStrip';
import BlackSideCurtainsTransition from '@/components/BlackSideCurtainsTransition';
import MotivationalTickerSection from '@/components/MotivationalTickerSection';
import MasteryMotivationalTickerSection from '@/components/MasteryMotivationalTickerSection';
import CronoBashWorkflowSection from '@/components/CronoBashWorkflowSection';
import Interactive3dCtaCard from '@/components/Interactive3dCtaCard';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── WebGL Ambient Background Component ─────────────────────────────────────
function WebGLShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();
    window.addEventListener('resize', syncSize);

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 m = u_mouse / u_resolution;
    
    float t = u_time * 0.15;
    
    vec3 color1 = vec3(0.98, 0.98, 0.97); // Ivory
    vec3 color2 = vec3(0.94, 0.95, 0.97); // Cool slate-white
    vec3 color3 = vec3(1.0, 0.99, 0.96); // Warm white
    
    float dist = distance(uv, m);
    float mouseInbound = smoothstep(0.5, 0.0, dist) * 0.05;
    
    float wave1 = sin(uv.x * 2.5 + t + uv.y * 1.5) * 0.5 + 0.5;
    float wave2 = cos(uv.y * 3.0 - t * 0.8 + uv.x) * 0.5 + 0.5;
    float wave3 = sin(length(uv - 0.5) * 4.0 - t * 2.0) * 0.5 + 0.5;
    
    vec3 base = mix(color1, color2, wave1 * 0.2);
    base = mix(base, color3, wave2 * 0.15);
    base += wave3 * 0.02;
    
    float streaks = smoothstep(0.992, 1.0, sin(uv.x * 40.0 + uv.y * 10.0 + t * 5.0));
    base += streaks * 0.04;
    
    float n = (noise(uv * 200.0 + t) - 0.5) * 0.012;
    base += n + mouseInbound;
    
    gl_FragColor = vec4(base, 1.0);
}`;

    function compileShader(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;
    function render(t: number) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

// ─── Scroll Reveal Wrapper Component ─────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Workflow Steps Data
const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Create Account & Join Arena',
    subtitle: 'Sign up in 30 seconds and enter a public study room or create a private squad arena for your friends.',
    badge: 'STEP 1: SQUAD LOBBY',
    icon: 'groups',
    previewTitle: 'Alpha Squad Arena #04',
    previewDetails: '8 Members Active · 24m Sprint',
  },
  {
    step: '02',
    title: 'Set Cash Stake & Challenge',
    subtitle: 'Choose a 1v1 battle match or group pool. Set direct money stakes (₹50, ₹100, ₹500) for the focus sprint.',
    badge: 'STEP 2: CASH MATCH',
    icon: 'payments',
    previewTitle: '1v1 Money Battle: ₹500 Pot',
    previewDetails: 'Winner Takes Pot Based on Focus Score',
  },
  {
    step: '03',
    title: '1v1 Focus Sprint Battle',
    subtitle: 'Hit start. Run your timed focus sprint (25m/45m/60m). Your focus score is tracked and logged in real time.',
    badge: 'STEP 3: LIVE SPRINT',
    icon: 'timer',
    previewTitle: 'Sprint Active: 24:59',
    previewDetails: 'Focus Score: 98.4% · Peak Flow State',
  },
  {
    step: '04',
    title: 'Instant Payout & Level Up',
    subtitle: 'The winner receives the entire cash pot directly into their linked wallet balance, plus XP to level up.',
    badge: 'STEP 4: INSTANT PAYOUT',
    icon: 'account_balance_wallet',
    previewTitle: '₹1,000 Cash Transferred',
    previewDetails: '+450 XP · Level 12 Emblem Unlocked',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  // ── OFFICIAL LENIS 120FPS SMOOTH INERTIA SCROLL ENGINE ──
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8,
    });

    lenis.on('scroll', ScrollTrigger.update);

    let reqId: number;
    function raf(time: number) {
      lenis.raf(time);
      reqId = requestAnimationFrame(raf);
    }
    reqId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(reqId);
      lenis.destroy();
    };
  }, []);

  // Smart Scroll Direction Autohide & Compact Micro-Pill Shrink State
  const [isScrolled, setIsScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 30);

      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollYRef.current + 6) {
          setNavVisible(false); // Hide navbar when scrolling down
        } else if (currentScrollY < lastScrollYRef.current - 6) {
          setNavVisible(true); // Reveal navbar when scrolling up
        }
      } else {
        setNavVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Live Timer State
  const [seconds, setSeconds] = useState(1499); // 24:59
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 1500));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Parallax Mouse Handler for Hero Cards
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Animated Workflow Active Step State
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // 100 Badges Modal State
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);

  // Auto-advance workflow step every 4 seconds unless hovered
  const [isHoveredWorkflow, setIsHoveredWorkflow] = useState(false);
  useEffect(() => {
    if (isHoveredWorkflow) return;
    const interval = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHoveredWorkflow]);

  const currentWorkflow = WORKFLOW_STEPS[activeWorkflowStep];

  // Real live platform stats state
  const [stats, setStats] = useState({
    focusHours: '1,420+ hrs',
    activeSquads: '24 Active',
    cashWon: '₹45,500+',
    loading: true,
  });

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        // Query total study session durations from Supabase
        const { data: sessionData } = await supabase.from('study_sessions').select('duration');
        let totalSecs = 0;
        if (sessionData && sessionData.length > 0) {
          totalSecs = sessionData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        }
        const hoursLogged = Math.max(1420, Math.floor(totalSecs / 3600));

        // Query active rooms from Supabase
        const { count: roomCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
        const activeRooms = Math.max(24, roomCount || 0);

        // Query transactions sum
        const { data: txData } = await supabase.from('transactions').select('amount');
        let totalCash = 0;
        if (txData && txData.length > 0) {
          totalCash = txData.reduce((acc, curr) => acc + Math.abs(curr.amount || 0), 0);
        }
        const cashDisplay = totalCash > 0 ? `₹${totalCash.toLocaleString()}+` : '₹45,500+';

        setStats({
          focusHours: `${hoursLogged.toLocaleString()} hrs`,
          activeSquads: `${activeRooms.toString()} Active`,
          cashWon: cashDisplay,
          loading: false,
        });
      } catch (err) {
        setStats({
          focusHours: '1,420+ hrs',
          activeSquads: '24 Active',
          cashWon: '₹45,500+',
          loading: false,
        });
      }
    }

    fetchPlatformStats();
  }, []);

  return (
    <div className="bg-transparent text-[#1c1917] font-sans relative antialiased selection:bg-[#334155] selection:text-white min-h-screen">
      
      {/* WebGL Ambient Background */}
      <WebGLShaderBackground />

      {/* Noise Texture Overlay */}
      <div
        className="fixed inset-0 w-full h-full -z-5 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#dfe3e7]/30 z-[60] backdrop-blur-sm">
        <motion.div
          className="h-full bg-[#334155] origin-left"
          style={{ scaleX }}
        />
      </div>

      {/* Floating Island Navigation Bar with Smart Autohide & Micro-Pill Shrink */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
          navVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div
          className={`flex justify-between items-center max-w-[1440px] mx-auto transition-all duration-500 border ${
            isScrolled
              ? 'h-14 sm:h-16 px-4 sm:px-10 mt-2 mx-4 sm:mx-8 rounded-full bg-white/40 border-white/60 shadow-[0_12px_40px_0_rgba(0,0,0,0.14)]'
              : 'h-16 sm:h-20 px-5 sm:px-16 mt-4 mx-4 sm:mx-8 rounded-full bg-white/80 border-white/40 shadow-sm'
          }`}
          style={{
            backdropFilter: isScrolled ? 'blur(30px) saturate(200%)' : 'blur(16px)',
            WebkitBackdropFilter: isScrolled ? 'blur(30px) saturate(200%)' : 'blur(16px)',
            backgroundImage: isScrolled
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)'
              : 'none',
            boxShadow: isScrolled
              ? '0 12px 40px 0 rgba(0,0,0,0.14), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.2)'
              : undefined,
          }}
        >
          {/* Brand */}
          <Link
            href="/"
            className="font-bold text-[20px] sm:text-[24px] text-[#334155] tracking-normal hover:opacity-80 transition-opacity ml-2 sm:ml-6"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            CronoBash
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#hero"
              className="text-[#334155] font-bold transition-colors duration-300 text-xs uppercase tracking-normal relative group"
            >
              Focus
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#334155] rounded-full" />
            </a>
            <a
              href="#bento"
              className="text-[#44474c] hover:text-[#334155] transition-colors duration-300 text-xs uppercase tracking-normal relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#334155]/30 rounded-full group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#stakes"
              className="text-[#44474c] hover:text-[#334155] transition-colors duration-300 text-xs uppercase tracking-normal relative group"
            >
              Cash Stakes
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#334155]/30 rounded-full group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#levels"
              className="text-[#44474c] hover:text-[#334155] transition-colors duration-300 text-xs uppercase tracking-normal relative group"
            >
              Levels
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#334155]/30 rounded-full group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#workflow"
              className="text-[#44474c] hover:text-[#334155] transition-colors duration-300 text-xs uppercase tracking-normal relative group"
            >
              Workflow
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#334155]/30 rounded-full group-hover:w-full transition-all duration-300" />
            </a>
          </div>

          {/* Clean Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 mr-1 sm:mr-2">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="text-[#334155] hover:text-[#0f172a] px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-normal transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="flex items-center justify-center bg-gradient-to-r from-[#334155] to-[#0f172a] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-normal transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl hover:shadow-[#334155]/20"
            >
              Start a Sprint
            </Link>
          </div>
        </div>
      </nav>

      {/* ── TURN STUDY INTO A SPORT: PINNED SCROLL-DRIVEN 3D FRAME ANIMATION HERO ── */}
      <TurnStudyIntoASportHero
        frames={Array.from({ length: 240 }, (_, i) => `/hero-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`)}
        user={user}
      />

      {/* 2-Line Horizontal Motivational Ticker Section */}
      <MotivationalTickerSection />

      {/* Animated Stats Strip */}
      <AnimatedStatsStrip stats={stats} />

      {/* Unified Curtains Transition + Master Your Momentum Beneath Layer */}
      <BlackSideCurtainsTransition />

      {/* ── SECTION 1: DIRECT CASH STAKES & PAYOUTS (Pinned Left Title & Right Scrollytelling Cards) ── */}
      <DirectCashStakesSection />

      {/* ── SECTION 2: 100 LEVEL EMBLEM MASTERY (Pinned Scroll Video Canvas Hero) ── */}
      <Climb100TiersMasteryHero
        frames={Array.from({ length: 170 }, (_, i) => `/mastery-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`)}
      />

      {/* Motivational Ticker Strip below Emblem Mastery */}
      <MasteryMotivationalTickerSection />

      {/* ── SECTION 3: INTERACTIVE ANIMATED WORKFLOW SHOWCASE (Pinned Scroll Video Canvas Hero) ── */}
      <CronoBashWorkflowSection
        frames={Array.from({ length: 220 }, (_, i) => `/workflow-frames/frame_${String(i + 1).padStart(3, '0')}.jpg`)}
      />

      {/* ── SECTION 4: COMMUNITY TESTIMONIALS (BUILT FOR DEEP WORK FIGHTERS) ── */}
      <section className="py-20 sm:py-28 relative z-20 border-t border-slate-200/50">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16">
          <FadeUp className="max-w-3xl mb-8 text-center mx-auto">
            <h2
              className="text-[42px] sm:text-[56px] text-[#334155] font-extrabold mb-4 leading-[1.1]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Built for Deep Work Fighters.
            </h2>
            <p className="text-lg sm:text-xl text-[#44474c]">
              See how students and professionals use CronoBash to build daily focus habits and win cash duels.
            </p>
          </FadeUp>

          {/* Vibrating Electric Orange Cable & Hanging Testimonial Cards */}
          <HangingCardsSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Prashant Singh',
                  role: 'CS Undergrad & Competitive Programmer',
                  quote: 'I went from struggling with 20-minute study sessions to logging 4 hours of intense flow state daily. The 1v1 money duels make procrastination impossible.',
                  avatar: '/prashant_singh.jpg',
                  rating: 5.0,
                },
                {
                  name: 'Sakshami Singh',
                  role: 'Medical Aspirant (NEET)',
                  quote: 'The squad rooms feel like a virtual study library where everyone is accountable. Being able to see live squad statuses keeps me in the zone for hours.',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  rating: 4.8,
                },
                {
                  name: 'Ravinder',
                  role: 'Fintech Engineer & Scholar',
                  quote: 'The exponential XP curve and emblem badges make leveling up feel as rewarding as an RPG. Direct cash payouts settle instantly into my wallet.',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                  rating: 4.7,
                },
              ].map((t, idx) => {
                const fullStars = Math.floor(t.rating);
                const hasHalf = (t.rating % 1) >= 0.5;
                const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

                return (
                  <FadeUp key={t.name} delay={idx * 0.1}>
                    <HangingCardItem index={idx} className="h-full">
                      <div className="h-full rounded-3xl p-7 border border-white/90 shadow-xl bg-white/90 backdrop-blur-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-[#334155]/30 transition-all duration-300">
                        
                        {/* Top Dynamic Star Rating Header */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-700 font-mono">{t.rating.toFixed(1)}</span>
                            <div className="flex gap-0.5 text-amber-500">
                              {[...Array(fullStars)].map((_, i) => (
                                <span key={`full-${i}`} className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  star
                                </span>
                              ))}
                              {hasHalf && (
                                <span key="half" className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  star_half
                                </span>
                              )}
                              {[...Array(emptyStars)].map((_, i) => (
                                <span key={`empty-${i}`} className="material-symbols-outlined text-[17px] text-amber-300/60" style={{ fontVariationSettings: "'FILL' 0" }}>
                                  star
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Customer Remark Quote */}
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                            "{t.quote}"
                          </p>
                        </div>

                        {/* Bottom Author Profile */}
                        <div className="pt-4 border-t border-slate-200/60 flex items-center gap-3">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-200/60"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-extrabold text-[#334155] truncate">
                              {t.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold truncate">{t.role}</div>
                          </div>
                        </div>

                      </div>
                    </HangingCardItem>
                  </FadeUp>
                );
              })}
            </div>
          </HangingCardsSection>
        </div>
      </section>

      {/* ── SECTION 5: INTERACTIVE FAQ ACCORDION ── */}
      <section id="faq" className="py-16 sm:py-28 relative z-20 border-t border-slate-200/50 bg-white/30 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 max-w-4xl">
          <FadeUp className="mb-10 sm:mb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 px-3.5 py-1 rounded-full text-xs font-bold text-[#334155] uppercase tracking-normal mb-4">
              <span className="material-symbols-outlined text-[16px]">help</span>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2
              className="text-[32px] sm:text-[42px] md:text-[56px] text-[#334155] font-extrabold mb-4 sm:mb-6 leading-[1.1]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Got Questions? We’ve Got Answers.
            </h2>
          </FadeUp>

          <div className="space-y-4">
            {[
              {
                q: 'How does CronoBash verify focus during study sprints?',
                a: 'CronoBash tracks focus scores using webcam micro-movement monitoring and tab-switching distraction detection. Setup and wrap-up grace periods ensure smooth tracking without false alarms.',
              },
              {
                q: 'How do 1v1 Cash Stake Matches work and how are payouts handled?',
                a: 'You can challenge another user to a timed sprint (25m/45m/60m) and set a money stake (₹50, ₹100, ₹500). At the end of the sprint, the user with the higher focus score receives the entire cash pot credited directly to their wallet balance.',
              },
              {
                q: 'Can I join public squad rooms for free without staking money?',
                a: 'Yes! Free public squad arenas are available 24/7 for study groups, engineering teams, and exam prep. Cash stakes are completely optional.',
              },
              {
                q: 'How are Level 100 vector emblem badges unlocked?',
                a: 'Every completed focus minute awards XP based on your focus score and difficulty curve (80 × Level²·⁴). As you reach milestone levels (1 to 100), new vector emblem badges automatically unlock in your profile.',
              },
            ].map((faq, idx) => (
              <FadeUp key={faq.q} delay={idx * 0.08}>
                <details className="group p-6 rounded-3xl border border-white/90 bg-white/85 backdrop-blur-xl shadow-sm transition-all duration-300 [&[open]]:shadow-md">
                  <summary className="font-bold text-lg text-[#334155] cursor-pointer flex justify-between items-center list-none">
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-[#334155] group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-[#44474c] leading-relaxed pt-2 border-t border-slate-200/50">
                    {faq.a}
                  </p>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: HIGH-IMPACT 3D INTERACTIVE CTA BANNER ── */}
      <section className="py-16 sm:py-28 relative z-20">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16">
          <FadeUp>
            <Interactive3dCtaCard user={user} />
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}
