"use client";

import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// ─── ULTRA-FAST & SMOOTH HIGH-CONTRAST HALFTONE CANVAS ENGINE ─────────────
function InteractiveHalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let width = (canvas.width = canvas.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth || window.innerWidth;
      height = canvas.height = canvas.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Tighter spacing for micro-sharp dots (20px)
    const spacing = 20;
    const cols = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    const dots: {
      originX: number;
      originY: number;
      x: number;
      y: number;
      baseRadius: number;
      currentRadius: number;
      currentAlpha: number;
    }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = c * spacing;
        const oy = r * spacing;

        const rightRatio = Math.max(0, Math.min(1, ox / width));
        const gradientFactor = Math.pow(rightRatio, 1.2);

        // Density falloff from right to left
        const probability = gradientFactor * 0.85 + 0.15;
        if (Math.random() > probability) {
          continue;
        }

        // Micro-sharp dots: 0.5px on far left -> 3.2px on far right
        const baseRadius = 0.5 + gradientFactor * 2.7;
        // Pitch-black high contrast dark alpha (0.15 on left -> 0.85 on far right)
        const baseAlpha = 0.15 + gradientFactor * 0.70;

        dots.push({
          originX: ox,
          originY: oy,
          x: ox,
          y: oy,
          baseRadius,
          currentRadius: baseRadius,
          currentAlpha: baseAlpha,
        });
      }
    }

    const render = () => {
      // Fast, ultra-responsive mouse tracking (0.35 lerp speed)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.35;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.35;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      // EXPANDED HOVER INFLUENCE AREA (340px)
      const influenceRadius = 340;

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      dots.forEach((dot) => {
        const dx = mx - dot.originX;
        const dy = my - dot.originY;
        const dist = Math.hypot(dx, dy);

        let targetRadius = dot.baseRadius;
        let targetAlpha = dot.currentAlpha;
        let pushX = 0;
        let pushY = 0;

        if (dist < influenceRadius) {
          const norm = 1 - dist / influenceRadius; // 0 to 1 intensity
          const easeNorm = Math.pow(norm, 2);

          // Fast depression into screen
          targetRadius = Math.max(0.3, dot.baseRadius * (1 - easeNorm * 0.75));
          targetAlpha = Math.max(0.05, dot.currentAlpha * (1 - easeNorm * 0.70));

          // Physical depression push displacement
          const angle = Math.atan2(dy, dx);
          const pushDist = easeNorm * 26;
          pushX = Math.cos(angle) * pushDist;
          pushY = Math.sin(angle) * pushDist;
        }

        // Lightning-fast, buttery smooth spring recovery (0.38 lerp)
        dot.x += (dot.originX + pushX - dot.x) * 0.38;
        dot.y += (dot.originY + pushY - dot.y) * 0.38;
        dot.currentRadius += (targetRadius - dot.currentRadius) * 0.38;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${targetAlpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#F8FAFC]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      {/* Soft Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8FAFC]/20 to-[#F8FAFC] pointer-events-none" />
    </div>
  );
}

// ─── MAIN SECURE STAKES SECTION WITH TACTILE DEPRESSION CARDS ─────────────
export default function DirectCashStakesSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive 280vh scroll distance for smooth card cascade
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 48,
    mass: 0.08,
    restDelta: 0.0001,
  });

  // ── LEFT PINNED TITLE ANIMATION ──────────
  const titleOpacity = useTransform(smoothProgress, [0.00, 0.08], [0, 1]);
  const titleScale = useTransform(smoothProgress, [0.00, 0.08], [0.85, 1.0]);

  // ── CARD 01 (Wallet) ─────────────────────────────────────
  const card1Opacity = useTransform(smoothProgress, [0.08, 0.22], [0, 1]);
  const card1X = useTransform(smoothProgress, [0.08, 0.22], [120, 0]);
  const card1Scale = useTransform(smoothProgress, [0.08, 0.22], [0.88, 1.0]);

  // ── CARD 02 (Duels) ────────────────────────────────────
  const card2Opacity = useTransform(smoothProgress, [0.28, 0.45], [0, 1]);
  const card2X = useTransform(smoothProgress, [0.28, 0.45], [160, 45]);
  const card2Y = useTransform(smoothProgress, [0.28, 0.45], [40, -15]);
  const card2Scale = useTransform(smoothProgress, [0.28, 0.45], [0.88, 1.0]);

  // ── CARD 03 (Pools - Fully Arrives at 0.70 and Holds Through 1.00) ─────
  const card3Opacity = useTransform(smoothProgress, [0.52, 0.70], [0, 1]);
  const card3X = useTransform(smoothProgress, [0.52, 0.70], [200, 90]);
  const card3Y = useTransform(smoothProgress, [0.52, 0.70], [60, -30]);
  const card3Scale = useTransform(smoothProgress, [0.52, 0.70], [0.88, 1.0]);

  return (
    <div ref={containerRef} id="stakes" className="relative h-[340vh] w-full bg-[#F8FAFC]">
      
      {/* Sticky Viewport Pinned Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center py-10 z-10 perspective-[1200px] bg-[#F8FAFC]">

        {/* Interactive 3D Depressable Halftone Canvas Background */}
        <InteractiveHalftoneBackground />

        {/* Top Fade Gradient */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#050711] via-transparent to-transparent pointer-events-none z-20" />

        {/* Bottom Fade Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent pointer-events-none z-20" />

        <div className="max-w-[1440px] mx-auto px-5 md:px-12 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ── LEFT COLUMN: SECURE & ENTERPRISE-GRADE TITLE ── */}
          <motion.div
            style={{
              opacity: titleOpacity,
              scale: titleScale,
            }}
            className="lg:col-span-5 flex flex-col items-start text-left"
          >
            <h2
              className="text-[40px] sm:text-[62px] lg:text-[76px] font-black text-slate-900 tracking-tight leading-[1.02]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              VERIFIED PAYOUTS <br />
              <span className="text-[#FF5500]">
                & SECURE STAKES.
              </span>
            </h2>
          </motion.div>

          {/* ── RIGHT COLUMN: DRAMATIC DEPRESSION CARDS ── */}
          <div className="lg:col-span-7 relative h-[380px] sm:h-[400px] w-full flex items-center justify-start pl-0 lg:pl-4">

            {/* ── CARD 01: Instant Wallet Settlement ── */}
            <motion.div
              style={{
                opacity: card1Opacity,
                x: card1X,
                scale: card1Scale,
                zIndex: 10,
              }}
              whileHover={{
                scale: 0.90,
                y: 18,
                boxShadow: 'inset 0 12px 32px rgba(0, 0, 0, 0.28), 0 8px 25px rgba(0, 0, 0, 0.08)',
              }}
              whileTap={{ scale: 0.86, y: 24 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="absolute w-[88%] sm:w-[350px] md:w-[380px] h-[340px] sm:h-[360px] rounded-3xl p-8 border border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.12)] bg-white/90 backdrop-blur-2xl text-slate-900 flex flex-col justify-between cursor-pointer group select-none transition-colors hover:bg-slate-50/95"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl sm:text-6xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    01
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 group-hover:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                  Instant Wallet Settlement
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Deposit funds directly or link your UPI wallet. Winnings from focus matches settle instantly into your withdrawable balance.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 02: 1v1 Verified Stake Matches ── */}
            <motion.div
              style={{
                opacity: card2Opacity,
                x: card2X,
                y: card2Y,
                scale: card2Scale,
                zIndex: 20,
              }}
              whileHover={{
                scale: 0.90,
                y: 18,
                boxShadow: 'inset 0 12px 32px rgba(0, 0, 0, 0.28), 0 8px 25px rgba(0, 0, 0, 0.08)',
              }}
              whileTap={{ scale: 0.86, y: 24 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="absolute w-[88%] sm:w-[350px] md:w-[380px] h-[340px] sm:h-[360px] rounded-3xl p-8 border border-slate-300 shadow-[0_25px_60px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-2xl text-slate-900 flex flex-col justify-between cursor-pointer group select-none transition-colors hover:bg-slate-50/95"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl sm:text-6xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    02
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 group-hover:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">swords</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                  1v1 Verified Stake Matches
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Set direct stakes (₹50, ₹100, ₹500) for a timed sprint. The highest verified focus score takes the entire escrow pot.
                </p>
              </div>
            </motion.div>

            {/* ── CARD 03: Daily Prize Pool Settlement ── */}
            <motion.div
              style={{
                opacity: card3Opacity,
                x: card3X,
                y: card3Y,
                scale: card3Scale,
                zIndex: 30,
              }}
              whileHover={{
                scale: 0.90,
                y: 18,
                boxShadow: 'inset 0 12px 32px rgba(0, 0, 0, 0.28), 0 8px 25px rgba(0, 0, 0, 0.08)',
              }}
              whileTap={{ scale: 0.86, y: 24 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="absolute w-[88%] sm:w-[350px] md:w-[380px] h-[340px] sm:h-[360px] rounded-3xl p-8 border border-slate-300 shadow-[0_30px_70px_rgba(0,0,0,0.18)] bg-white/90 backdrop-blur-2xl text-slate-900 flex flex-col justify-between cursor-pointer group select-none transition-colors hover:bg-slate-50/95"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl sm:text-6xl font-black text-[#FF5500] tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    03
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200 group-hover:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">emoji_events</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                  Daily Prize Pool Settlement
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Top focus rankers on daily study leaderboards split guaranteed prize pools every night at midnight directly to verified accounts.
                </p>
              </div>
            </motion.div>

          </div>

        </div>
      </div>

    </div>
  );
}
