"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Timer, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
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

  return (
    <div className="morphism-card bg-white p-5 rounded-[24px] space-y-4 shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:border-[#10B981] transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-sm">
              <Timer className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Time Tracker</h3>
              <p className="text-[11px] text-slate-500 font-medium">Quick Stopwatch</p>
            </div>
          </div>

          <Link
            href="/study"
            className="text-xs text-[#10B981] hover:underline font-bold flex items-center gap-1 transition"
          >
            Study Room <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Stopwatch Display */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1">
          <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
            {formatTime(seconds)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {subject} Sprint
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
            isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#10B981] hover:bg-[#059669]'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={handleReset}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
