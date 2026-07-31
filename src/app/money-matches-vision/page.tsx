"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { 
  ArrowLeft, Brain, Zap, Target, ShieldCheck, Trophy, Sparkles, 
  CheckCircle2, Cpu, Activity, Flame, Lightbulb, Compass, Lock, Eye
} from 'lucide-react';

export default function MoneyMatchesVisionPage() {
  const router = useRouter();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background py-10 px-4 md:px-8 max-w-5xl mx-auto space-y-12 select-none relative overflow-hidden">
      
      {/* Background Radial Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Top Back Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between border-b border-outline-variant/40 pb-5 backdrop-blur-md"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-mono text-on-surface-variant hover:text-white transition-all cursor-pointer bg-surface-container/80 hover:bg-surface-container-high px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-lg hover:border-amber-500/40 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          NEUROSCIENCE & FOCUS MANIFESTO
        </span>
      </motion.div>

      {/* Main Container with staggered Framer Motion entrance */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >

        {/* Hero Section: Soul-touching statement */}
        <motion.div variants={itemVariants} className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 bg-primary-container/10 border border-primary-container/30 px-5 py-2 rounded-full text-xs font-mono text-primary-fixed shadow-[0_0_20px_rgba(0,255,163,0.15)]"
          >
            <Brain className="w-4 h-4 text-primary-fixed" />
            <span>RE-ANCHORING HUMAN FOCUS IN AN ERA OF DISTRACTION</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black text-white font-display tracking-tight leading-tight">
            Why Money Matches Exist:<br />
            <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,163,0.3)]">
              The Science of Absolute Focus
            </span>
          </h1>

          <p className="text-base text-on-surface-variant leading-relaxed font-sans max-w-2xl mx-auto">
            You don't lack ambition or intelligence. You are simply fighting an unfair war against social algorithms engineered to hijack your dopamine. <strong className="text-white">CronoBash Money Matches</strong> leverage behavioral economics and cognitive neuroscience to lock your brain into peak study performance.
          </p>
        </motion.div>

        {/* Section 1: The Psychological Problem & Behavioral Economics (Neumorphic Cards) */}
        <motion.div 
          variants={itemVariants} 
          className="glass-panel p-8 md:p-10 space-y-6 rounded-3xl relative overflow-hidden"
        >
          {/* Subtle Ambient Light Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              01
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display">Behavioral Economics & Loss Aversion</h2>
              <p className="text-xs text-on-surface-variant font-mono">Why passive study timers fail when cognitive demands are high</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-on-surface-variant leading-relaxed">
            
            {/* Neumorphic Inset Card 1 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="neu-inset p-6 rounded-2xl space-y-3 relative group"
            >
              <div className="flex items-center gap-2 text-white font-bold font-display text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                <span>The Dopamine Exhaustion Loop</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                When studying with a normal timer, your brain evaluates the reward as distant (months away during exams). Meanwhile, picking up your phone gives an instant spike in dopamine. Over time, this creates procrastination, broken study streaks, and guilt.
              </p>
            </motion.div>

            {/* Neumorphic Inset Card 2 */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="neu-inset p-6 rounded-2xl space-y-3 relative group border-emerald-500/30"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-display text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(0,255,163,0.8)]" />
                <span>The Kahneman & Tversky Principle</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Nobel Prize-winning research proves that <strong className="text-white">human beings feel the pain of losing 2.5x more intensely than the pleasure of gaining.</strong> Staking focus tokens in a 1v1 match creates a psychological anchor that shifts your prefrontal cortex from passive drift into 100% laser hyper-focus.
              </p>
            </motion.div>

          </div>
        </motion.div>

        {/* Section 2: Yerkes-Dodson Curve Diagram & 3D Glass Elevation */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel p-8 md:p-10 space-y-8 rounded-3xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              02
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display">Yerkes-Dodson Law of Optimal Arousal</h2>
              <p className="text-xs text-on-surface-variant font-mono">5x Flow State Activation & Peak Brain Efficiency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4 text-sm text-on-surface-variant leading-relaxed">
              <p>
                Psychologists Yerkes and Dodson established that optimal cognitive performance requires a precise level of physiological arousal. Without stakes, studying causes boredom. Excess panic causes burnout.
              </p>
              <p>
                <strong className="text-white">Money Matches lock you into the optimal apex of the Yerkes-Dodson curve.</strong> By pairing a 1v1 camera focus sprint with a token stake, your prefrontal cortex enters the coveted <span className="text-cyan-400 font-bold">Flow State</span> 5x faster than conventional study sessions.
              </p>

              <div className="space-y-2.5 pt-3 text-xs font-mono text-on-surface">
                <div className="flex items-center gap-2.5 bg-surface-container-high/60 p-2.5 rounded-xl border border-outline-variant/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero Notification Checking during active sprints</span>
                </div>
                <div className="flex items-center gap-2.5 bg-surface-container-high/60 p-2.5 rounded-xl border border-outline-variant/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>MediaPipe AI gaze tracking verifies 100% human presence</span>
                </div>
                <div className="flex items-center gap-2.5 bg-surface-container-high/60 p-2.5 rounded-xl border border-outline-variant/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Structured 50-minute sprints prevent cognitive exhaustion</span>
                </div>
              </div>
            </div>

            {/* Infographic with Neumorphic Border */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-6 rounded-2xl overflow-hidden border border-outline-variant/60 shadow-2xl relative bg-neutral-950 p-3 group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src="/brain_flowstate_neuroscience.png" 
                alt="Yerkes-Dodson Law & Brain Flow State Infographic" 
                className="w-full h-auto rounded-xl object-cover relative z-10 shadow-lg"
              />
              <p className="text-[10px] text-on-surface-variant font-mono text-center pt-2.5 font-bold">
                Figure 1.0: Yerkes-Dodson Optimal Cognitive Performance & Flow Activation Graph
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section 3: 4 Scientific Pillars Supporting Money Matches & CronoBash (Claymorphism & Neumorphism) */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-white font-display">Core Scientific Pillars of CronoBash</h2>
            <p className="text-xs text-on-surface-variant font-mono">Four proven psychological & neurological mechanisms engineered for academic mastery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pillar 1: Claymorphism Neon */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              className="clay-neon p-7 space-y-4 relative group overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">1. Social Facilitation (The Zajonc Effect)</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                Social psychologist Robert Zajonc proved that human beings perform well-learned tasks <strong className="text-white">up to 34% more efficiently when in the presence of an active peer.</strong> In 1v1 camera focus duels, seeing your opponent intently studying eliminates off-task urges and reinforces mutual accountability.
              </p>
            </motion.div>

            {/* Pillar 2: Claymorphism Purple */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              className="clay-purple p-7 space-y-4 relative group overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(0,255,163,0.2)]">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">2. Synaptic Memory Consolidation</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                Neuroscience shows that uninterrupted 50-minute study blocks stimulate <strong className="text-white">Long-Term Potentiation (LTP)</strong> in the hippocampus. By protecting your attention from context switching, information moves from short-term working memory into permanent long-term retention.
              </p>
            </motion.div>

            {/* Pillar 3: Neumorphic Inset */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-panel p-7 space-y-4 rounded-3xl relative group overflow-hidden border-cyan-500/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">3. Prefrontal Cortex Stamina Building</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                Focus is a mental muscle managed by the executive function of the prefrontal cortex. Daily structured focus duels increase your mental fatigue threshold, allowing you to endure multi-hour competitive exams (like JEE, NEET, or UPSC) without cognitive decay.
              </p>
            </motion.div>

            {/* Pillar 4: Neumorphic Inset */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-panel p-7 space-y-4 rounded-3xl relative group overflow-hidden border-purple-500/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">4. MediaPipe AI Frame Alignment</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                CronoBash utilizes Google's MediaPipe on-device computer vision engine to compute facial landmarks, head pose orientation, and gaze alignment in real time. Your video stream is processed locally in browser memory without recording, ensuring complete privacy while maintaining 100% verified integrity.
              </p>
            </motion.div>

          </div>
        </motion.div>

        {/* Section 4: Final CTA Card with Shimmer & Animated Light Beam */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel p-8 md:p-12 space-y-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-emerald-500/40 text-center relative overflow-hidden shadow-2xl"
        >
          {/* Background Pulsing Shimmer Light Beam */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <h2 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight">Our Promise to Every Ambitious Student</h2>
          <p className="text-xs md:text-sm text-on-surface-variant font-mono max-w-xl mx-auto leading-relaxed">
            We believe every student possesses extraordinary potential when placed inside an optimal cognitive environment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4 max-w-3xl mx-auto">
            <div className="neu-inset p-5 rounded-2xl space-y-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white text-sm font-display">100% Skill-Based Contests</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                No luck, no chance. Outcomes are strictly determined by human study seconds and cognitive discipline.
              </p>
            </div>

            <div className="neu-inset p-5 rounded-2xl space-y-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-sm font-display">MediaPipe AI Gaze Engine</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                On-device computer vision verifies real human focus frame-by-frame, ensuring a fair, level playing field.
              </p>
            </div>
          </div>

          <div className="pt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/study')}
              className="bg-primary-container text-on-primary font-mono text-xs font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-2xl hover:bg-primary-fixed transition shadow-[0_0_25px_rgba(0,255,163,0.4)] cursor-pointer"
            >
              Start a Free Focus Session Now →
            </motion.button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
