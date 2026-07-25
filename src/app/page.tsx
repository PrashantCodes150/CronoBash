"use client";

import React, { useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Footer from '@/components/Footer';

// ─── 3D: Animated distorted glowing orb ──────────────────────────────────────
function GlowOrb({ position, color, speed, distort }: {
  position: [number, number, number];
  color: string;
  speed: number;
  distort: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * speed * 0.3;
    meshRef.current.rotation.y += delta * speed * 0.5;
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.4}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={2}
          roughness={0.1}
          metalness={0.4}
          transparent
          opacity={0.65}
        />
      </Sphere>
    </Float>
  );
}

// ─── 3D: Floating particle cloud ─────────────────────────────────────────────
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1800;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    return pos;
  }, []);
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.012;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#00FFA3" size={0.04} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

// ─── 3D: Full hero scene ─────────────────────────────────────────────────────
function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[8, 8, 8]}   intensity={2.5} color="#00FFA3" />
      <pointLight position={[-8, -8, -4]} intensity={1.2} color="#7B61FF" />
      <Stars radius={90} depth={50} count={3500} factor={3} saturation={0.5} fade speed={0.5} />
      <ParticleField />
      <GlowOrb position={[2.5,  0.5, -2]} color="#00FFA3" speed={0.8} distort={0.45} />
      <GlowOrb position={[-2.2, -1,  -3]} color="#7B61FF" speed={0.5} distort={0.35} />
      <GlowOrb position={[0.3,  2.8, -4]} color="#00BFFF" speed={0.6} distort={0.30} />
    </>
  );
}


// ─── Animated Sine Wave Section ──────────────────────────────────────────────
function SineWaveSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  const waves = [
    { color: '#00FFA3', amplitude: 28, frequency: 0.012, speed: 0.022, phase: 0,     lineWidth: 2.5, opacity: 0.9 },
    { color: '#7B61FF', amplitude: 40, frequency: 0.009, speed: 0.016, phase: 1.2,   lineWidth: 2,   opacity: 0.75 },
    { color: '#00BFFF', amplitude: 20, frequency: 0.016, speed: 0.030, phase: 2.4,   lineWidth: 1.8, opacity: 0.7 },
    { color: '#FF6B6B', amplitude: 34, frequency: 0.010, speed: 0.012, phase: 3.6,   lineWidth: 2,   opacity: 0.6 },
    { color: '#FFD93D', amplitude: 22, frequency: 0.014, speed: 0.025, phase: 5.0,   lineWidth: 1.5, opacity: 0.55 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    const phaseOffsets = waves.map(w => w.phase);

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      waves.forEach((wave, i) => {
        phaseOffsets[i] += wave.speed;
        const centerY = H / 2;

        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth   = wave.lineWidth;
        ctx.globalAlpha = wave.opacity;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur  = 10;

        for (let x = 0; x <= W; x += 1) {
          const y = centerY + wave.amplitude * Math.sin(wave.frequency * x + phaseOffsets[i]);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
      });

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '160px' }}>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}

// ─── Scroll-triggered reveal wrapper ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'backOut' }}
      whileHover={{ y: -4 }}
      className="flex flex-col items-center gap-3 p-7 bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 transition-colors group"
    >
      <span className="material-symbols-outlined text-3xl text-primary-fixed group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-display text-4xl font-black text-on-surface">{value}</span>
      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest text-center">{label}</span>
    </motion.div>
  );
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }: {
  icon: string; title: string; desc: string; accent: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group bg-surface-container rounded-2xl border border-outline-variant p-8 overflow-hidden transition-all duration-400 cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent} to-transparent`} />
      <div className="relative z-10 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-2xl text-primary-fixed">{icon}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-on-surface">{title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LandingPage() {

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale   = useTransform(scrollYProgress, [0, 0.2], [1, 0.94]);
  const heroY       = useTransform(scrollYProgress, [0, 0.2], [0, -80]);

  // Lenis smooth scroll
  useEffect(() => {
    let lenis: any;
    (async () => {
      const { default: Lenis } = await import('lenis');
      lenis = new Lenis({ duration: 1.4, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    })();
    return () => { try { lenis?.destroy?.(); } catch (_) {} };
  }, []);

  const features = [
    { icon: 'visibility',            title: 'AI Gaze Tracking',     desc: 'MediaPipe face mesh monitors your iris in real time. Look away and your focus score decays instantly.', accent: 'from-primary-container/10', delay: 0 },
    { icon: 'groups',                title: 'Study Squads',          desc: 'Form private rooms with your squad. Share focus streaks, chat live, and keep each other accountable.', accent: 'from-secondary-container/10', delay: 0.07 },
    { icon: 'account_balance_wallet',title: 'Token Economy',         desc: 'Earn TKN for every focused second. Spend it in challenges, stake it in money lobbies, or climb the arena.', accent: 'from-tertiary-container/10', delay: 0.14 },
    { icon: 'leaderboard',           title: 'Live Leaderboards',     desc: 'Real-time global and room-specific rankings. Track your position minute by minute in the arena.', accent: 'from-primary-container/10', delay: 0.21 },
    { icon: 'sports_esports',        title: 'Stake Challenges',      desc: 'Bet tokens head-to-head. Winner takes the pot. High-intensity focus battles that actually matter.', accent: 'from-error-container/10', delay: 0.28 },
    { icon: 'monitoring',            title: 'Analytics Dashboard',   desc: 'Deep session telemetry with attention graphs, streak charts, and mode distribution charts.', accent: 'from-secondary-container/10', delay: 0.35 },
  ];

  const steps = [
    { id: '01', icon: 'how_to_reg',   title: 'Sign Up',       desc: 'Create your profile, claim 1000 welcome tokens, and select your subjects.' },
    { id: '02', icon: 'meeting_room', title: 'Join a Room',   desc: 'Enter a public room, private squad room, or stake tokens in a money lobby.' },
    { id: '03', icon: 'timer',        title: 'Focus Sprint',  desc: 'Activate webcam tracking, start the timer, and log deep study seconds.' },
    { id: '04', icon: 'star',         title: 'Earn & Win',    desc: 'Claim pool splits, climb leaderboards, and redeem your focus tokens.' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen font-sans overflow-x-hidden relative">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-background/70 backdrop-blur-lg border-b border-outline-variant/50">
        <Link href="/" className="flex items-center group cursor-pointer select-none no-underline w-64 shrink-0">
          <div className="font-display text-xl md:text-2xl font-medium tracking-wide flex items-center text-primary-fixed">
            <span className="font-dancing text-2xl md:text-3xl font-bold italic select-none">C</span>
            <span className="text-on-surface">rono</span>
            <span className="font-dancing text-2xl md:text-3xl font-bold italic select-none">B</span>
            <span className="text-on-surface">ash</span>
          </div>
        </Link>
        <div className="hidden md:flex space-x-8">
          {[['#features','Features'],['#workflow','Workflow'],['#stats','Stats']].map(([href, label]) => (
            <a key={href} href={href} className="text-on-surface-variant font-mono text-xs hover:text-primary-fixed transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-on-surface-variant hover:text-primary-fixed transition-colors font-mono text-xs">Login</Link>
          <Link href="/signup" className="bg-primary-container text-on-primary font-mono text-xs px-5 py-2 rounded-lg font-bold hover:scale-95 transition-transform hover:bg-primary-fixed shadow-[0_0_15px_rgba(0,255,163,0.3)]">Sign Up</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Full-bleed 3D canvas background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          </Canvas>
        </div>

        {/* Radial dark vignette */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]" />

        {/* Hero text — sits inside the section, centered */}
        <div className="relative z-20 text-center max-w-4xl mx-auto px-6 pt-20 pb-28 space-y-8">

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-black text-on-surface leading-tight">
            Eliminate Distractions.{' '}
            <span className="text-primary-fixed glow-text-primary">Master Absolute Focus.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2 }}
            className="text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Engineered for students driven by perfection and unstoppable academic ambition. Powered by real-time computer vision focus tracking.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup" className="bg-primary-container text-on-primary font-mono text-sm px-9 py-4 rounded-xl font-bold hover:bg-primary-fixed transition-all text-center shadow-[0_0_28px_rgba(0,255,163,0.45)] hover:scale-[1.04] hover:shadow-[0_0_45px_rgba(0,255,163,0.65)]">
              Start Studying Now →
            </Link>
            <Link href="/login" className="border border-outline-variant bg-surface-container/30 backdrop-blur text-on-surface font-mono text-sm px-9 py-4 rounded-xl font-bold hover:border-primary-fixed hover:text-primary-fixed transition-colors text-center">
              Enter The Lobby
            </Link>
          </motion.div>

          {/* Live animated metric pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            {[
              { icon: 'people', label: '12,841 students online', color: 'text-primary-fixed' },
              { icon: 'timer', label: '4.2M focus minutes', color: 'text-secondary-fixed' },
              { icon: 'emoji_events', label: '850 live lobbies', color: 'text-yellow-400' },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-1.5 bg-surface-container/50 backdrop-blur border border-outline-variant/40 px-3 py-1.5 rounded-full">
                <span className={`material-symbols-outlined text-sm ${pill.color}`}>{pill.icon}</span>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{pill.label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse ml-1" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue — anchored to section bottom, outside content stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 pointer-events-none"
        >
          <span className="font-mono text-[10px] text-on-surface-variant/60 uppercase tracking-widest">Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <span className="material-symbols-outlined text-primary-fixed text-xl">arrow_downward</span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Sine Wave Transition ─────────────────────── */}
      <SineWaveSection />

      {/* ── Stats Bar ──────────────────────────────────── */}
      <section id="stats" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <StatCard value="12K+"  label="Active Students"        icon="school" />
            <StatCard value="4.2M"  label="Focus Minutes Logged"   icon="timer" />
            <StatCard value="98K+"  label="Tokens Distributed"     icon="account_balance_wallet" />
            <StatCard value="850+"  label="Live Arenas Today"        icon="groups" />
          </div>
        </Reveal>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-14">
        <Reveal className="text-center max-w-2xl mx-auto space-y-4">
          <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest">Capabilities</span>
          <h2 className="font-display text-4xl font-black text-on-surface">The ultimate study rig</h2>
          <p className="text-on-surface-variant">Built for performance, designed to eliminate distractions.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>


      {/* ── Parabola Divider ──────────────────────────── */}
      <div className="w-full overflow-hidden" style={{ height: '120px' }}>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-purple">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <style>{`
              @keyframes drawParabola {
                from { stroke-dashoffset: 1600; }
                to   { stroke-dashoffset: 0; }
              }
              @keyframes drawParabola2 {
                from { stroke-dashoffset: 1700; }
                to   { stroke-dashoffset: 0; }
              }
              @keyframes drawParabola3 {
                from { stroke-dashoffset: 1500; }
                to   { stroke-dashoffset: 0; }
              }
              .parabola-1 {
                stroke-dasharray: 1600;
                stroke-dashoffset: 1600;
                animation: drawParabola 2s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
              }
              .parabola-2 {
                stroke-dasharray: 1700;
                stroke-dashoffset: 1700;
                animation: drawParabola2 2.3s cubic-bezier(0.4,0,0.2,1) 0.3s forwards;
              }
              .parabola-3 {
                stroke-dasharray: 1500;
                stroke-dashoffset: 1500;
                animation: drawParabola3 1.8s cubic-bezier(0.4,0,0.2,1) 0.5s forwards;
              }
            `}</style>
          </defs>

          {/* Shadow purple parabola (offset below) */}
          <path
            d="M 0 110 Q 720 -30 1440 110"
            fill="none"
            stroke="#7B61FF"
            strokeWidth="2"
            opacity="0.4"
            filter="url(#glow-purple)"
            className="parabola-2"
          />

          {/* Cyan accent parabola (slightly smaller arc) */}
          <path
            d="M 0 115 Q 720 10 1440 115"
            fill="none"
            stroke="#00BFFF"
            strokeWidth="1.5"
            opacity="0.35"
            className="parabola-3"
          />

          {/* Main neon green parabola */}
          <path
            d="M 0 112 Q 720 -20 1440 112"
            fill="none"
            stroke="#00FFA3"
            strokeWidth="2.5"
            opacity="0.9"
            filter="url(#glow-green)"
            className="parabola-1"
          />
        </svg>
      </div>

      {/* ── Workflow ───────────────────────────────────── */}
      <section id="workflow" className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        <Reveal className="text-center space-y-4">
          <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest">How it works</span>
          <h2 className="font-display text-4xl font-black text-on-surface">Enter the Arena</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary-container/40 to-transparent" />
          {steps.map((step, idx) => (
            <Reveal key={step.id} delay={idx * 0.1}>
              <div className="flex flex-col items-center text-center space-y-4">
                <motion.div whileHover={{ scale: 1.1, rotate: 6 }}
                  className="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center relative shadow-[0_0_20px_rgba(0,255,163,0.08)] hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] transition-shadow">
                  <span className="font-mono text-xs text-primary-fixed opacity-25 absolute top-2 right-3 font-bold">{step.id}</span>
                  <span className="material-symbols-outlined text-3xl text-on-surface">{step.icon}</span>
                </motion.div>
                <h3 className="font-display text-lg font-bold text-on-surface">{step.title}</h3>
                <p className="text-on-surface-variant text-xs max-w-[200px] leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <Reveal>
          <div className="relative bg-surface-container rounded-3xl border border-primary-container/20 p-16 text-center overflow-hidden min-h-[380px] flex items-center justify-center">
            {/* 3D ambient orbs inside CTA */}
            <div className="absolute inset-0 z-0 opacity-25">
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[0, 0, 5]} intensity={3} color="#00FFA3" />
                  <GlowOrb position={[-3, -1, -2]} color="#00FFA3" speed={0.4} distort={0.5} />
                  <GlowOrb position={[3,   1, -2]} color="#7B61FF" speed={0.3} distort={0.4} />
                </Suspense>
              </Canvas>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/5 to-transparent z-10" />
            <div className="relative z-20 max-w-2xl mx-auto space-y-6">
              <h2 className="font-display text-4xl md:text-5xl font-black text-on-surface">Ready to start grinding?</h2>
              <p className="text-on-surface-variant text-lg">Join students worldwide who have turned their daily study habits into a high-octane sport.</p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="bg-primary-container text-on-primary font-mono text-sm px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform inline-block shadow-[0_0_25px_rgba(0,255,163,0.4)]">
                  Create Free Account
                </Link>
                <Link href="/login" className="border border-outline-variant text-on-surface-variant font-mono text-sm px-10 py-4 rounded-xl font-bold hover:border-primary-container hover:text-primary-fixed transition-colors inline-block">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
