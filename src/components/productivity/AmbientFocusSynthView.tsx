"use client";

import React, { useState, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AmbientFocusSynthView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [preset, setPreset] = useState<'alpha' | 'beta' | 'theta' | 'pink'>('alpha');
  const [volume, setVolume] = useState(0.3);

  // Real Functional Toggles (Persisted in LocalStorage)
  const [stereoEntrainment, setStereoEntrainment] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('synth_stereo') !== 'false';
    }
    return true;
  });

  const [autoMuteDistraction, setAutoMuteDistraction] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('synth_auto_mute') !== 'false';
    }
    return true;
  });

  const handleToggleStereo = () => {
    const nextVal = !stereoEntrainment;
    setStereoEntrainment(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('synth_stereo', String(nextVal));
    }
    toast.success(nextVal ? 'Stereo binaural entrainment active (L/R frequency split).' : 'Mono entrainment active.');
    if (isPlaying) {
      startAudioSynth(preset);
    }
  };

  const handleToggleAutoMute = () => {
    const nextVal = !autoMuteDistraction;
    setAutoMuteDistraction(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('synth_auto_mute', String(nextVal));
    }
    toast.success(nextVal ? 'Auto-mute background noise suppression active.' : 'Noise suppression off.');
  };

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLeftRef = useRef<OscillatorNode | null>(null);
  const oscRightRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const presets = [
    {
      id: 'alpha',
      name: 'Alpha Waves (10 Hz)',
      desc: 'Deep Focus & Flow State (Study Sprints)',
      color: 'bg-blue-50 border-blue-200 text-[#3B82F6]',
      freqLeft: 200,
      freqRight: 210,
    },
    {
      id: 'beta',
      name: 'Beta Waves (18 Hz)',
      desc: 'High Alertness & Problem Solving',
      color: 'bg-purple-50 border-purple-200 text-[#9333EA]',
      freqLeft: 250,
      freqRight: 268,
    },
    {
      id: 'theta',
      name: 'Theta Waves (6 Hz)',
      desc: 'Creative Brainstorming & Memory Lock',
      color: 'bg-emerald-50 border-emerald-200 text-[#10B981]',
      freqLeft: 150,
      freqRight: 156,
    },
    {
      id: 'pink',
      name: 'Pink Noise Engine',
      desc: 'Ambient Distraction Noise Masking',
      color: 'bg-amber-50 border-amber-200 text-[#F59E0B]',
      freqLeft: 180,
      freqRight: 184,
    },
  ] as const;

  const startAudioSynth = (selectedPreset: typeof preset) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscLeftRef.current) {
        oscLeftRef.current.stop();
        oscLeftRef.current.disconnect();
      }
      if (oscRightRef.current) {
        oscRightRef.current.stop();
        oscRightRef.current.disconnect();
      }

      const currentConfig = presets.find(p => p.id === selectedPreset) || presets[0];

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNodeRef.current = gainNode;

      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();

      oscLeft.type = 'sine';
      oscRight.type = 'sine';

      // Apply Stereo Entrainment frequency split
      if (stereoEntrainment) {
        oscLeft.frequency.setValueAtTime(currentConfig.freqLeft, ctx.currentTime);
        oscRight.frequency.setValueAtTime(currentConfig.freqRight, ctx.currentTime);
      } else {
        const avgFreq = (currentConfig.freqLeft + currentConfig.freqRight) / 2;
        oscLeft.frequency.setValueAtTime(avgFreq, ctx.currentTime);
        oscRight.frequency.setValueAtTime(avgFreq, ctx.currentTime);
      }

      oscLeft.connect(gainNode);
      oscRight.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscLeft.start();
      oscRight.start();

      oscLeftRef.current = oscLeft;
      oscRightRef.current = oscRight;

      setIsPlaying(true);
      toast.success(`Playing ${currentConfig.name}! 🎧`);
    } catch (e) {
      console.error(e);
      toast.error('Web Audio API not supported on this device.');
    }
  };

  const stopAudioSynth = () => {
    try {
      if (oscLeftRef.current) {
        oscLeftRef.current.stop();
        oscLeftRef.current.disconnect();
      }
      if (oscRightRef.current) {
        oscRightRef.current.stop();
        oscRightRef.current.disconnect();
      }
      setIsPlaying(false);
      toast.success('Binaural beats paused.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioSynth();
    } else {
      startAudioSynth(preset);
    }
  };

  const handleSelectPreset = (pId: typeof preset) => {
    setPreset(pId);
    if (isPlaying) {
      startAudioSynth(pId);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">graphic_eq</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Frequency</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 capitalize">{preset} Synth</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">headphones</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Playback Status</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{isPlaying ? 'Playing Live 🎧' : 'Paused'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">volume_up</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Synth Volume</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{Math.round(volume * 100)}%</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">bolt</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Stereo Mode</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{stereoEntrainment ? 'Binaural L/R' : 'Mono Split'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── CONTROLS & REAL FUNCTIONAL BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">headphones</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Stereo Entrainment</span>
            <button
              onClick={handleToggleStereo}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                stereoEntrainment ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${stereoEntrainment ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">volume_off</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Auto-Mute Distractions</span>
            <button
              onClick={handleToggleAutoMute}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoMuteDistraction ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoMuteDistraction ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={handleTogglePlay}
          className={`w-full md:w-auto px-6 py-2.5 rounded-full font-black text-xs transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-2 ${
            isPlaying ? 'bg-amber-500 text-white' : 'bg-[#1D1D1F] text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'Pause Beats' : 'Start Audio Synth'}</span>
        </button>
      </div>

      {/* ── PRESET SOUND CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map(p => {
          const isSelected = preset === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectPreset(p.id as any)}
              className={`morphism-card bg-white p-5 rounded-[24px] border shadow-sm space-y-3 transition-all cursor-pointer ${
                isSelected ? 'border-[#3B82F6] ring-2 ring-blue-500/20 scale-105' : 'border-white/80 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${p.color}`}>
                  {p.id.toUpperCase()}
                </span>
                {isSelected && isPlaying && <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>}
              </div>

              <h4 className="text-sm font-extrabold text-slate-900 truncate">{p.name}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
