"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ShieldAlert, Zap, Clock, Activity, Award, Eye, Compass, Scale } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';

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
  gazeScore?: number;
  poseStability?: number;
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
  level = 1,
  gazeScore = 100,
  poseStability = 100
}: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showDistractionAlert, setShowDistractionAlert] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!isFocused && !isSelf) {
      setShowDistractionAlert(true);
      const timer = setTimeout(() => setShowDistractionAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFocused, isSelf]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const netSettlementScore = Math.max(0, Math.round(focusScore - distractionCount * 15));

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border-2 transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.8)] ${
        !isFocused 
          ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse' 
          : 'border-emerald-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,255,163,0.2)]'
      }`}
    >
      {/* Video Feed */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf || isMuted}
          className={`w-full h-full object-cover ${isSelf ? 'transform -scale-x-100' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-400 p-4 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-white font-black text-2xl mb-2 shadow-[0_0_15px_rgba(0,255,163,0.3)] animate-pulse">
            {name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{name}</span>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            CAMERA STANDBY
          </span>
        </div>
      )}

      {/* Top Left Tag: Name & Verified Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/40 shadow-[0_0_12px_rgba(0,255,163,0.2)]">
        <span className="text-xs font-black text-white font-sans max-w-[120px] truncate">{name}</span>
        <VerifiedBadge level={level} size="sm" showLevelNumber={false} />
        {isSelf && (
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,163,0.3)] animate-pulse">You</span>
        )}
      </div>

      {/* Top Right Tag: Distraction Counter */}
      {distractionCount > 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-rose-950/90 backdrop-blur-md border border-rose-500/60 text-rose-300 px-3 py-1 rounded-full font-mono text-[10px] font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-bounce">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>{distractionCount} STRIKES</span>
        </div>
      )}

      {/* Distraction Alert Flash Banner */}
      <AnimatePresence>
        {showDistractionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-3 top-14 z-30 bg-gradient-to-r from-rose-600 to-amber-600 backdrop-blur-md text-white text-xs font-mono font-black py-2 px-4 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 border border-rose-400"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce text-yellow-300" />
            <span>CONTESTANT DISTRACTED!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Audio Status */}
      <div className="absolute bottom-3 right-3 z-20 bg-neutral-950/80 backdrop-blur-md p-2 rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,163,0.2)]">
        {isMuted ? (
          <MicOff className="w-4 h-4 text-rose-400" />
        ) : (
          <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
        )}
      </div>

      {/* Hover Overlay: Real-time Scientific Telemetry, Gauges & Settlement Impact */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 bg-black/90 p-4 flex flex-col justify-between text-left font-mono border-2 border-emerald-500/50 rounded-2xl overflow-y-auto"
          >
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
              <div>
                <span className="text-[9px] text-neutral-400 block uppercase font-bold tracking-wider">SCIENTIFIC TELEMETRY</span>
                <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                  {name}
                  <VerifiedBadge level={level} size="sm" showLevelNumber={true} />
                </span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${isFocused ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' : 'bg-red-950/80 border-red-500/40 text-red-400'}`}>
                {isFocused ? '⚡ FOCUSED' : '⚠️ DISTRACTED'}
              </span>
            </div>

            {/* Core Stats Gauges */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>FOCUS SCORE</span>
                </div>
                <span className="text-sm font-black text-amber-300 mt-0.5 block">
                  {focusScore.toFixed(0)}<span className="text-[10px] text-neutral-400 font-normal">%</span>
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>FOCUS TIME</span>
                </div>
                <span className="text-xs font-bold text-emerald-300 mt-1 block truncate">
                  {formatTime(focusSeconds)}
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>GAZE ACCURACY</span>
                </div>
                <span className="text-xs font-bold text-cyan-300 mt-1 block">
                  {gazeScore}%
                </span>
              </div>

              <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                  <Compass className="w-3 h-3 text-purple-400" />
                  <span>POSE STABILITY</span>
                </div>
                <span className="text-xs font-bold text-purple-300 mt-1 block">
                  {poseStability}%
                </span>
              </div>
            </div>

            {/* Match Settlement Breakdown Card */}
            <div className="bg-neutral-950/80 border border-emerald-500/30 p-2.5 rounded-xl space-y-1 text-[9px]">
              <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-neutral-800 pb-1 uppercase">
                <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> SETTLEMENT IMPACT</span>
                <span>NET SCORE: {netSettlementScore}</span>
              </div>
              <div className="flex justify-between text-neutral-400 pt-1">
                <span>Distraction Penalty:</span>
                <span className="text-red-400 font-bold">-{distractionCount * 15}%</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Match Decision Impact:</span>
                <span className="text-emerald-300 font-bold">{netSettlementScore >= 60 ? '🏆 WINNER ELIGIBLE' : '💀 LOSS RISK'}</span>
              </div>
            </div>

            {/* Mini Focus Graph Timeline preview */}
            <div className="bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl mt-2">
              <div className="flex justify-between items-center mb-1 text-[9px] text-neutral-400">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> FOCUS GRAPH</span>
                <span className="text-[8px] text-emerald-400 font-bold">100% SYNCED</span>
              </div>
              <div className="h-9 w-full flex items-end gap-1 pt-1 border-t border-neutral-800/60">
                {focusTimeline && focusTimeline.length > 0 ? (
                  focusTimeline.slice(-12).map((pt, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-t transition-all duration-300 ${pt.level > 0 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-red-700 to-red-500'}`}
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
