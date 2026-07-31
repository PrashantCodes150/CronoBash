"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-context';
import { Timer, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  // Black Pill Switches
  const [soundBell, setSoundBell] = useState(true);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playFinishSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
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
              if (soundBell) playFinishSound();
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
  }, [isRunning, mode, pomodoroTarget, soundBell]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const handleSaveSession = async () => {
    if (seconds < 10) {
      toast.error('Session duration must be at least 10 seconds to save!');
      return;
    }

    setIsRunning(false);

    logSession({
      subject,
      duration_seconds: seconds,
      mode,
    });

    if (user) {
      try {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          start_time: new Date(Date.now() - seconds * 1000).toISOString(),
          end_time: new Date().toISOString(),
          focus_seconds: seconds,
          total_seconds: seconds,
          name: `${subject} Focus Sprint`
        });
      } catch (e) {
        console.error(e);
      }
    }

    toast.success('Focus session saved to stats! 🚀');
    setSeconds(0);
  };

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalLogSecs = (sessions || []).reduce((acc: number, log: any) => acc + (log.duration_seconds || 0), 0);
  const totalLogHours = (totalLogSecs / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS (SOLID CIRCLE BADGES & ↗ ARROWS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">timer</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Focus Time</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{totalLogHours} Hours</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">history</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions Logged</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{sessions.length} Sprints</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">bolt</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Sprint</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{formatTimer(seconds)}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">local_fire_department</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Goal</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">85% Achieved 🔥</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── TIMER CONTROLS & BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#EAB308] text-white flex items-center justify-center text-xs font-bold">
              <span className="material-symbols-outlined text-xs">volume_up</span>
            </span>
            <span className="text-xs font-bold text-slate-900">Audio Finish Bell</span>
            <button
              onClick={() => setSoundBell(!soundBell)}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                soundBell ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${soundBell ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">coffee</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Auto-Start Breaks</span>
            <button
              onClick={() => setAutoStartBreaks(!autoStartBreaks)}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoStartBreaks ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoStartBreaks ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        {/* Pomodoro Preset Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => { setPomodoroTarget(mins); setMode('pomodoro'); setSeconds(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                pomodoroTarget === mins && mode === 'pomodoro' ? 'bg-[#1D1D1F] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* ── TIMER STAGE & SESSIONS LOG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 morphism-card bg-white p-8 rounded-[28px] border border-white/80 shadow-sm text-center space-y-6">
          <div className="py-4">
            <span className="text-6xl sm:text-7xl font-black font-mono tracking-widest text-slate-900">
              {formatTimer(seconds)}
            </span>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
              {mode === 'pomodoro' ? `Pomodoro Target: ${pomodoroTarget} Mins` : 'Active Stopwatch Counter'}
            </p>
          </div>

          <div className="flex justify-center items-center gap-3">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-transform hover:scale-105 cursor-pointer shadow-md flex items-center gap-2 ${
                isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-[#10B981] hover:bg-emerald-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isRunning ? 'Pause Sprint' : 'Start Focus Sprint'}</span>
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {seconds > 10 && (
              <button
                onClick={handleSaveSession}
                className="px-6 py-3.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Session</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Recent Sessions</h3>
            <span className="text-xs font-bold text-slate-400">{totalLogHours}h total</span>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar">
            {(sessions || []).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-8">No saved sessions yet</p>
            ) : (
              (sessions || []).map((log: any, i: number) => (
                <div key={log.id || i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">#{log.subject || 'Study'}</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{log.mode || 'sprint'}</span>
                  </div>
                  <span className="text-xs font-black text-[#3B82F6]">
                    {Math.round((log.duration_seconds || 0) / 60)} mins
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
