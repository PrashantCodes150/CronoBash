"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background min-h-screen font-sans overflow-x-hidden relative">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-lg font-bold">bolt</span>
          </div>
          <span className="font-display text-xl font-black text-primary-fixed tracking-tighter">
            FocusArena
          </span>
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-on-surface-variant font-medium font-mono text-xs hover:text-primary-fixed transition-colors">Features</a>
          <a href="#workflow" className="text-on-surface-variant font-medium font-mono text-xs hover:text-primary-fixed transition-colors">Workflow</a>
          <a href="#prizes" className="text-on-surface-variant font-medium font-mono text-xs hover:text-primary-fixed transition-colors">Stakes</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-on-surface-variant hover:text-primary-fixed transition-colors font-mono text-xs">
            Login
          </Link>
          <Link href="/signup" className="bg-primary-container text-on-primary font-mono text-xs px-5 py-2 rounded-lg font-bold hover:scale-95 transition-transform hover:bg-primary-fixed shadow-[0_0_15px_rgba(0,255,163,0.3)]">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto space-y-32">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[600px]">
          <div className="lg:col-span-6 space-y-8 z-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-surface-container-high px-4 py-1.5 rounded-full border border-primary-container/30"
            >
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-mono text-xs text-primary-fixed-dim uppercase tracking-widest">System Status: Optimal</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-black text-on-surface leading-tight"
            >
              Turn your study time into a <span className="text-primary-fixed glow-text-primary">competitive game</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-on-surface-variant max-w-lg leading-relaxed"
            >
              Track focus, stake tokens, challenge friends, and climb the leaderboard. Step into the arena and elevate your productivity to esports levels.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="/signup" className="bg-primary-container text-on-primary font-headline-md text-sm px-8 py-4 rounded-xl font-bold hover:bg-primary-fixed transition-all text-center shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:scale-[1.02]">
                Start Studying Now
              </Link>
              <Link href="/login" className="border border-outline-variant bg-transparent text-on-surface font-headline-md text-sm px-8 py-4 rounded-xl font-bold hover:border-primary-fixed hover:text-primary-fixed transition-colors text-center">
                Enter The Lobby
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative w-full aspect-square max-w-[500px] mx-auto bg-surface-container rounded-2xl border border-outline-variant overflow-hidden glow-primary bg-grid-pattern flex flex-col items-center justify-center">
              {/* Camera feed widget simulation */}
              <div className="absolute top-4 right-4 w-1/3 aspect-video bg-surface-container-highest rounded-lg border border-primary-container/40 overflow-hidden pulse-border z-20">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=200" 
                  alt="Student study feed" 
                />
                <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-primary-fixed font-mono flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">videocam</span>
                  <span>LIVE</span>
                </div>
              </div>
              
              {/* Circular Timer Ring */}
              <div className="relative w-56 h-56 rounded-full border-4 border-surface-variant flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle 
                    cx="112" 
                    cy="112" 
                    r="104" 
                    fill="transparent" 
                    stroke="#00FFA3" 
                    strokeDasharray="653" 
                    strokeDashoffset="180" 
                    strokeWidth="4"
                    className="drop-shadow-[0_0_6px_#00FFA3]"
                  ></circle>
                </svg>
                <div className="text-center z-10">
                  <div className="font-mono text-3xl text-on-surface font-bold tracking-tight">45:00</div>
                  <div className="font-mono text-[10px] text-primary-fixed mt-1 tracking-widest font-bold">IN FOCUS</div>
                </div>
              </div>

              {/* Status element */}
              <div className="absolute bottom-6 left-6 bg-surface-container-high/80 backdrop-blur border border-outline-variant rounded-lg p-3 flex items-center gap-3">
                <div className="bg-secondary-container/20 p-2 rounded">
                  <span className="material-symbols-outlined text-secondary-fixed text-sm">emoji_events</span>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-on-surface-variant uppercase">Daily Rank</div>
                  <div className="font-mono text-xs text-on-surface font-bold">#42 Global</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-3xl font-black text-on-surface">The ultimate study rig</h2>
            <p className="text-on-surface-variant">Built for performance, designed to eliminate distractions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-surface-container rounded-2xl border border-outline-variant p-8 relative overflow-hidden group hover:border-primary-container/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[160px]">
                <div className="bg-surface-variant w-12 h-12 rounded-lg flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-2xl">visibility</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface mb-2">Smart Focus Detection</h3>
                  <p className="text-on-surface-variant text-sm max-w-md">Our lightweight tracking algorithms ensure you stay in the zone. Look away for too long, and your focus multiplier drops.</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 bg-surface-container rounded-2xl border border-outline-variant p-8 relative overflow-hidden group hover:border-secondary-container/40 transition-colors">
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[160px]">
                <div className="bg-surface-variant w-12 h-12 rounded-lg flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined text-2xl">groups</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface mb-2">Study Squads</h3>
                  <p className="text-on-surface-variant text-sm">Join lobby rooms. Sync your timers, study side-by-side, and challenge other cohorts.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Flow */}
        <section id="workflow" className="space-y-16">
          <h2 className="font-display text-3xl font-black text-on-surface text-center">Enter the Arena</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              { id: '01', icon: 'how_to_reg', title: 'Sign Up', desc: 'Create your profile, claim welcome tokens, and select your subjects.' },
              { id: '02', icon: 'meeting_room', title: 'Join a Room', desc: 'Enter a public room, private squad room, or stake tokens in a money lobby.' },
              { id: '03', icon: 'timer', title: 'Focus Sprint', desc: 'Activate your webcam check, start the timer, and log deep study seconds.' },
              { id: '04', icon: 'star', title: 'Earn & Win', desc: 'Claim pool splits, climb leaderboards, and redeem your focus points.' }
            ].map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center relative group">
                  <span className="font-mono text-xs text-primary-fixed opacity-20 absolute top-2 right-3 font-bold">{step.id}</span>
                  <span className="material-symbols-outlined text-3xl text-on-surface">{step.icon}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface">{step.title}</h3>
                <p className="text-on-surface-variant text-xs max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Container */}
        <section className="bg-surface-container rounded-2xl border border-primary-container/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/5 to-transparent"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-3xl font-black text-on-surface">Ready to start grinding?</h2>
            <p className="text-on-surface-variant">Join students worldwide who have turned their daily study habits into a high-octane sport.</p>
            <div className="pt-4">
              <Link href="/signup" className="bg-primary-container text-on-primary font-mono text-xs px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform inline-block shadow-[0_0_20px_rgba(0,255,163,0.3)]">
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest border-t border-outline-variant text-xs text-on-surface-variant font-mono">
        <span className="font-display text-md font-black text-primary-fixed mb-4 md:mb-0">FocusArena</span>
        <div className="flex gap-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-primary-fixed">Privacy Policy</a>
          <a href="#" className="hover:text-primary-fixed">Terms of Service</a>
          <a href="#" className="hover:text-primary-fixed">Discord</a>
        </div>
        <div>© 2026 FocusArena. All rights reserved.</div>
      </footer>
    </div>
  );
}
