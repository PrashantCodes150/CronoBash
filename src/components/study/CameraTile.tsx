"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ShieldAlert, Zap, Clock, Activity, Award } from 'lucide-react';

interface ChartPoint {
  time: string;
  level: number;
}

interface CameraTileProps {
  userId: string;
  name: string;
  stream?: MediaStream;
  isSelf?: boolean;
  isFocused?: boolean;
  isMuted?: boolean;
  distractionCount?: number;
  focusScore?: number;
  focusSeconds?: number;
  focusTimeline?: ChartPoint[];
  level?: number;
}

export function CameraTile({
  userId,
  name,
  stream,
  isSelf = false,
  isFocused = true,
  isMuted = false,
  distractionCount = 0,
  focusScore = 100,
  focusSeconds = 0,
  focusTimeline = [],
  level = 1
}: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showDistractionAlert, setShowDistractionAlert] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.debug("Autoplay blocked or stream connection delay:", err);
      });
    }
  }, [stream, userId]);

  useEffect(() => {
    if (distractionCount > 0) {
      setShowDistractionAlert(true);
      const timer = setTimeout(() => setShowDistractionAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [distractionCount]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl aspect-square flex flex-col items-center justify-center group transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-950/30"
    >
      {/* Distraction Alert Flash Overlay */}
      <AnimatePresence>
        {!isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.2, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-red-950/60 z-10 pointer-events-none border-2 border-red-500 rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* Video element */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover transform scale-x-[-1] transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-neutral-900 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold text-sm">
            {name ? name.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Stream Connecting...</span>
        </div>
      )}

      {/* Default Overlay - Top Name tag and indicators */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-800/80 text-white text-xs max-w-[140px] truncate shadow-md">
          <span className="font-semibold">{name}</span>
          {isSelf && <span className="text-[9px] text-emerald-400 font-mono font-bold">(YOU)</span>}
        </div>

        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {showDistractionAlert && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1 bg-red-950/90 border border-red-800/60 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-md shadow-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Strike #{distractionCount}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`w-3 h-3 rounded-full border border-black ${isFocused ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
        </div>
      </div>

      {/* Default Bottom Mic Indicator */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-black/75 backdrop-blur-md p-1.5 rounded-lg border border-neutral-800">
        {isMuted ? (
          <MicOff className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>

      {/* Hover Overlay: Real-time Stats, Score & Graph */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 bg-black/85 p-4 flex flex-col justify-between text-left font-mono border-2 border-emerald-500/40 rounded-2xl overflow-y-auto"
          >
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">RIG CONTESTANT</span>
                <span className="text-sm font-bold text-white block truncate max-w-[150px]">{name}</span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${isFocused ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' : 'bg-red-950/80 border-red-500/40 text-red-400'}`}>
                {isFocused ? '⚡ FOCUSED' : '⚠️ DISTRACTED'}
              </span>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>FOCUS SCORE</span>
                </div>
                <span className="text-base font-black text-amber-300 mt-0.5 block">
                  {focusScore.toFixed(0)}<span className="text-[10px] text-neutral-400 font-normal">%</span>
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>STUDY TIME</span>
                </div>
                <span className="text-xs font-bold text-emerald-300 mt-1 block truncate">
                  {formatTime(focusSeconds)}
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>STRIKES</span>
                </div>
                <span className="text-xs font-bold text-red-400 mt-1 block">
                  {distractionCount} / 5
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Award className="w-3 h-3 text-purple-400" />
                  <span>CONSISTENCY</span>
                </div>
                <span className="text-xs font-bold text-purple-300 mt-1 block">
                  {distractionCount === 0 ? '100%' : `${Math.max(20, 100 - distractionCount * 16)}%`}
                </span>
              </div>
            </div>

            {/* Mini Focus Graph Timeline preview */}
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
              <div className="flex justify-between items-center mb-1 text-[9px] text-neutral-400">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> FOCUS GRAPH</span>
                <span className="text-[8px] text-emerald-400 font-bold">LIVE METRICS</span>
              </div>
              <div className="h-9 w-full flex items-end gap-1 pt-1 border-t border-neutral-800/60">
                {focusTimeline && focusTimeline.length > 0 ? (
                  focusTimeline.slice(-12).map((pt, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(15, pt.level * 100)}%` }}
                    />
                  ))
                ) : (
                  <div className="w-full text-center text-[8px] text-neutral-500 py-1 italic">
                    Collecting focus telemetry...
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
