"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Timer, Play, Pause, RotateCcw, ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';

export function TimeTrackerWidget() {
  const { sessions, logSession } = useProductivityStore();

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState('Engineering');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (seconds > 10) {
      logSession({
        subject,
        duration_seconds: seconds,
        mode: 'stopwatch',
      });
    }
    setIsRunning(false);
    setSeconds(0);
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const todayMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60
  );

  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4 shadow-lg flex flex-col justify-between h-full hover:border-primary/40 transition">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Time Tracker</h3>
              <p className="text-[11px] text-on-surface-variant font-mono">Live Focus Stopwatch</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=tracker"
            className="text-xs text-primary-fixed hover:text-white font-mono flex items-center gap-1 transition"
          >
            Tracker Hub <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Live Timer Card */}
        <div className="bg-surface-container-high/80 p-4 rounded-xl border border-outline-variant/40 text-center space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
            <span>Subject: {subject}</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-3 h-3" /> {todayMinutes}m today
            </span>
          </div>

          <div className="text-3xl font-mono font-bold text-white tracking-widest my-1">
            {formatTime(seconds)}
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                isRunning
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-primary text-on-primary hover:brightness-110'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isRunning ? 'Pause' : 'Start Focus'}
            </button>

            {seconds > 0 && (
              <button
                onClick={handleReset}
                className="p-1.5 bg-surface-variant hover:bg-surface-container-high text-on-surface-variant hover:text-white rounded-lg transition"
                title="Save & Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
