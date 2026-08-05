"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Banknote, Timer, BarChart2, ArrowRight, CheckCircle, Pause, GitBranch } from 'lucide-react';

interface CronoBashWorkflowSectionProps {
  frames?: string[];
  user?: any;
}

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Create Account & Join Room',
    subtitle: 'Sign up in seconds and enter a public study room or create a private squad room for your group.',
    badge: 'STEP 1 — SQUAD LOBBY',
    Icon: Users,
    previewTitle: 'Focus Study Room #04',
    previewDetails: '8 Members Active · 25m Session',
  },
  {
    step: '02',
    title: 'Set Target Goal & Stakes',
    subtitle: 'Choose your focus duration (25m / 45m / 60m) and set optional stakes for accountability.',
    badge: 'STEP 2 — SESSION CONFIG',
    Icon: Banknote,
    previewTitle: '45-Minute Focus Session',
    previewDetails: 'Goal: Zero Tab Switches',
  },
  {
    step: '03',
    title: 'Active Focus Sprint',
    subtitle: 'Start your timer. Real-time telemetry monitors focus score and tracks distractions automatically.',
    badge: 'STEP 3 — LIVE SPRINT',
    Icon: Timer,
    previewTitle: 'Sprint Active: 24:59',
    previewDetails: 'Focus Score: 98.4% · High Flow State',
  },
  {
    step: '04',
    title: 'Analytics & Level Up',
    subtitle: 'Review your session report, earn XP toward milestone badges, and log stats to your profile.',
    badge: 'STEP 4 — SUMMARY & XP',
    Icon: BarChart2,
    previewTitle: 'Session Completed',
    previewDetails: '+450 XP · Level 12 Badge Unlocked',
  },
];

export default function CronoBashWorkflowSection({ user }: CronoBashWorkflowSectionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const currentWorkflow = WORKFLOW_STEPS[activeStep];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="workflow" className="py-20 sm:py-28 bg-white border-t border-slate-200/80 relative z-20 overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-6 md:px-16">

        {/* Section Header */}
        <div className="max-w-2xl mb-12 text-center mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 border border-slate-200/80 px-4 py-1.5 rounded-full text-xs font-semibold text-crono-muted uppercase tracking-[0.06em] font-sans">
            <GitBranch className="w-3.5 h-3.5" />
            System Workflow
          </span>
          <h2 className="text-[clamp(28px,4.5vw,48px)] font-medium text-crono-text tracking-[-0.03em] leading-[1.08] font-sans">
            How CronoBash Works.
          </h2>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Step Cards */}
          <div className="lg:col-span-6 space-y-3">
            {WORKFLOW_STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'bg-crono-dark border-crono-dark shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 font-sans ${isActive ? 'bg-white/10 text-[#fafafa]' : 'bg-slate-100 text-crono-text'}`}>
                      {s.step}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold truncate font-sans transition-colors ${isActive ? 'text-[#fafafa]' : 'text-crono-text'}`}>
                          {s.title}
                        </h3>
                        {isActive && <ArrowRight className="w-4 h-4 text-[#fafafa]/60 shrink-0" />}
                      </div>
                      <p className={`text-xs leading-normal font-normal font-sans line-clamp-2 transition-colors ${isActive ? 'text-[#fafafa]/60' : 'text-crono-muted'}`}>
                        {s.subtitle}
                      </p>
                      {isActive && (
                        <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden mt-2">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 4.5, ease: 'linear' }}
                            className="bg-white/40 h-full rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Preview Card */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm h-[320px] sm:h-[340px] flex flex-col justify-between relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWorkflow.step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-[11px] font-semibold text-crono-text uppercase tracking-[0.04em] flex items-center gap-1.5 font-sans">
                      <currentWorkflow.Icon className="w-3.5 h-3.5" />
                      {currentWorkflow.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-sans">
                      LIVE DEMO
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-semibold text-crono-text font-sans">{currentWorkflow.previewTitle}</h4>
                    <p className="text-xs text-crono-muted font-normal font-sans">{currentWorkflow.previewDetails}</p>
                  </div>

                  {activeStep === 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-crono-dark text-[#fafafa] flex items-center justify-center font-semibold text-[10px] font-sans">CB</div>
                        <div>
                          <div className="text-xs font-semibold text-crono-text font-sans">Engineering Arena</div>
                          <div className="text-[11px] text-crono-muted font-sans">8 Members Ready</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 font-sans">ONLINE</span>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="p-3 bg-crono-dark text-[#fafafa] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-crono-accent font-semibold uppercase font-sans">Stake Amount</div>
                        <div className="text-lg font-semibold font-sans">₹500 Cash Pot</div>
                      </div>
                      <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-semibold border border-white/20 font-sans">MATCH LOCKED</div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-crono-muted uppercase font-semibold font-sans">Sprint Countdown</div>
                        <div className="text-2xl font-semibold text-crono-text font-sans">24:59</div>
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center">
                        <Pause className="w-3.5 h-3.5 text-crono-text" />
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-emerald-700 font-sans">Victory Payout</div>
                        <div className="text-lg font-semibold text-emerald-900 font-sans">₹1,000 Transferred</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-semibold text-crono-muted font-sans">
                <span>STEP {activeStep + 1} OF 4</span>
                <Link href={user ? '/dashboard' : '/signup'} className="text-crono-text hover:opacity-55 transition-opacity flex items-center gap-1 font-sans">
                  Start Sprint Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
