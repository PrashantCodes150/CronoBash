"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-context';
import { Timer, Play, Pause, RotateCcw, CheckCircle, Flame, History, Award, Tag } from 'lucide-react';

export function TimeTrackerView() {
  const { user } = useAuth();
  const { sessions, logSession } = useProductivityStore();

  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [subject, setSubject] = useState<string>('Engineering');
  
  // Timer internal state
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Pomodoro preset minutes
  const [pomodoroTarget, setPomodoroTarget] = useState<number>(25);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound generator effect using Web Audio API for timer finish bell
  const playFinishSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (mode === 'pomodoro') {
            const maxSec = pomodoroTarget * 60;
            if (prev + 1 >= maxSec) {
              setIsRunning(false);
              playFinishSound();
              return maxSec;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, pomodoroTarget]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const handleSaveSession = async () => {
    if (seconds < 10) {
      alert('Session duration must be at least 10 seconds to save!');
      return;
    }

    setIsRunning(false);

    // Save to local productivity store
    logSession({
      subject,
      duration_seconds: seconds,
      mode,
      notes: sessionNotes || undefined,
    });

    // Sync to Supabase study_sessions if logged in
    if (user) {
      try {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          start_time: new Date(Date.now() - seconds * 1000).toISOString(),
          end_time: new Date().toISOString(),
          focus_seconds: seconds,
          total_seconds: seconds,
        });
      } catch (e) {
        console.warn('Could not sync study session to Supabase:', e);
      }
    }

    alert(`Awesome work! Saved ${formatTime(seconds)} of focus time under ${subject}.`);
    setSeconds(0);
    setSessionNotes('');
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Compute ring progress for Pomodoro
  const maxPomodoroSec = pomodoroTarget * 60;
  const progressRatio = mode === 'pomodoro' ? Math.min(seconds / maxPomodoroSec, 1) : (seconds % 60) / 60;
  const strokeDashoffset = 283 - 283 * progressRatio;

  // Stats calculation
  const totalTrackedToday = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-high border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Timer className="w-7 h-7 text-primary-fixed" />
            Focus Time Tracker
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Track real-time study sessions with Pomodoro or Stopwatch modes.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface-variant p-2 rounded-xl border border-outline-variant/40">
          <Flame className="w-5 h-5 text-amber-400" />
          <div className="text-xs font-mono">
            <span className="text-on-surface-variant">Today's Focus: </span>
            <span className="text-primary-fixed font-bold">{Math.round(totalTrackedToday / 60)} mins</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Main Panel */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl border border-outline-variant/50 p-6 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          {/* Mode Switcher */}
          <div className="flex items-center bg-surface-variant p-1.5 rounded-xl border border-outline-variant/40">
            <button
              onClick={() => { setMode('stopwatch'); handleResetTimer(); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                mode === 'stopwatch' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Stopwatch
            </button>
            <button
              onClick={() => { setMode('pomodoro'); handleResetTimer(); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                mode === 'pomodoro' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Pomodoro Timer
            </button>
          </div>

          {/* Subject & Pomodoro Target Presets */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-fixed" />
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="bg-surface-variant text-on-surface text-xs border border-outline-variant/40 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Algorithms">Algorithms</option>
                <option value="CS Core">CS Core</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Design">Design</option>
              </select>
            </div>

            {mode === 'pomodoro' && (
              <div className="flex items-center gap-1 bg-surface-variant px-2 py-1 rounded-lg border border-outline-variant/40">
                {[15, 25, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => { setPomodoroTarget(mins); handleResetTimer(); }}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition ${
                      pomodoroTarget === mins ? 'bg-primary text-black font-bold' : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SVG Progress Ring & Big Timer Display */}
          <div className="relative w-64 h-64 flex items-center justify-center my-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="text-surface-variant stroke-current"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="text-primary-fixed stroke-current transition-all duration-500"
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center space-y-1">
              <span className="text-5xl font-mono font-bold text-white tracking-wider">
                {mode === 'pomodoro' ? formatTime(maxPomodoroSec - seconds) : formatTime(seconds)}
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-primary-fixed font-bold">
                {isRunning ? 'FOCUS ACTIVE' : 'PAUSED'}
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono">{subject}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetTimer}
              className="p-3 bg-surface-variant hover:bg-surface-container-high text-on-surface-variant hover:text-white rounded-xl transition border border-outline-variant/40"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base transition shadow-lg ${
                isRunning
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
                  : 'bg-primary text-on-primary hover:brightness-110 shadow-primary/30'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isRunning ? 'Pause' : 'Start Focus'}
            </button>

            {seconds > 0 && (
              <button
                onClick={handleSaveSession}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                Log Session
              </button>
            )}
          </div>

          {/* Session Notes input */}
          <div className="w-full max-w-md pt-2">
            <input
              type="text"
              placeholder="Add optional notes for this focus session..."
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant/40 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary text-center"
            />
          </div>
        </div>

        {/* Right Panel: Session Logs & History */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4">
          <div className="border-b border-outline-variant/40 pb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary-fixed" />
              Session Logs
            </h3>
            <span className="text-xs font-mono text-on-surface-variant font-bold">
              {sessions.length} recorded
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
            {sessions.length === 0 ? (
              <div className="text-xs text-on-surface-variant/60 italic font-mono py-8 text-center border border-dashed border-outline-variant/30 rounded-xl">
                No focus sessions logged yet today. Click "Start Focus" to begin!
              </div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  className="bg-surface-container-high p-3.5 rounded-xl border border-outline-variant/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{s.subject}</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      +{Math.round(s.duration_seconds / 60)} mins
                    </span>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-on-surface-variant italic">"{s.notes}"</p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono pt-1 border-t border-outline-variant/20">
                    <span className="capitalize">{s.mode} mode</span>
                    <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
