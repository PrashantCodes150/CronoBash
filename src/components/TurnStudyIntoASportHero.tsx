"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SplineSceneContainer from '@/components/SplineSceneContainer';

interface TurnStudyIntoASportHeroProps {
  frames?: string[];
  user?: any;
  splineSceneUrl?: string;
}

export default function TurnStudyIntoASportHero({ user, splineSceneUrl }: TurnStudyIntoASportHeroProps) {
  return (
    <section id="hero" className="relative min-h-[85vh] sm:min-h-screen w-full flex items-center justify-center pt-28 sm:pt-36 pb-16 overflow-hidden">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[350px] h-[350px] bg-slate-100/60 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-[1440px] mx-auto px-5 md:px-16 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col gap-6 sm:gap-8"
          >
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide self-start shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multiplayer Study & Focus Platform</span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-[40px] sm:text-[58px] md:text-[68px] lg:text-[76px] text-slate-900 tracking-tight leading-[1.05] font-extrabold"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Elevate Your Study Sprints & Productivity.
            </h1>

            <p className="text-base sm:text-xl leading-relaxed text-slate-600 max-w-xl font-normal">
              CronoBash provides structured focus rooms, real-time distraction telemetry, squad accountability, and habit tracking for high-performance learning.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-5 pt-2">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="bg-slate-900 hover:bg-slate-800 text-white px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg flex items-center gap-2 group"
              >
                Start Focusing Now
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <a
                href="#bento"
                className="bg-white border border-slate-200 text-slate-700 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-200 hover:bg-slate-50 active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">widgets</span>
                Platform Features
              </a>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-sm">verified</span>
                <span>Focus Detection AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-sm">group</span>
                <span>Group Study Arenas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-sm">analytics</span>
                <span>Detailed Productivity Telemetry</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Interactive Visual Stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative min-h-[420px]"
          >
            {splineSceneUrl ? (
              <div className="w-full h-[450px] sm:h-[500px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-950">
                <SplineSceneContainer scene={splineSceneUrl} />
              </div>
            ) : (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl flex flex-col gap-6">
                
                {/* Card Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                      45M
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Active Study Room</h3>
                      <p className="text-xs text-slate-500 font-medium">Sprint Mode: 45 Minutes</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    IN PROGRESS
                  </span>
                </div>

                {/* Timer & Focus Telemetry Bar */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">TIMER REMAINING</span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      HIGH FOCUS
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-white">
                    34:28
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Focus Score Telemetry</span>
                      <span className="text-white font-bold">98.6%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[98.6%]" />
                    </div>
                  </div>
                </div>

                {/* Room Participants */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Participants</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img src="/prashant_singh.webp" alt="Avatar" className="w-8 h-8 rounded-full border border-white" />
                        <span className="text-xs font-bold text-slate-800">Prashant S.</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 font-mono">98.6%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          SS
                        </div>
                        <span className="text-xs font-bold text-slate-800">Sakshami S.</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 font-mono">94.2%</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
