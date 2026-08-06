"use client";

import React from 'react';
import SplineSceneContainer from '@/components/SplineSceneContainer';

interface Dashboard3dFocusOrbProps {
  splineSceneUrl?: string;
  focusScore?: number;
}

export default function Dashboard3dFocusOrb({ splineSceneUrl, focusScore = 98.4 }: Dashboard3dFocusOrbProps) {
  if (splineSceneUrl) {
    return (
      <div className="w-full h-full min-h-[260px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-xl relative">
        <SplineSceneContainer scene={splineSceneUrl} />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[260px] rounded-3xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden select-none">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF5500]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex justify-between items-center z-10">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
          3D FOCUS ENGINE
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          FLOW STATE
        </span>
      </div>

      {/* Animated 3D Sphere Representation */}
      <div className="relative my-4 flex items-center justify-center z-10">
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#FF5500] via-amber-500 to-orange-400 p-[3px] animate-pulse shadow-[0_0_40px_rgba(255,85,0,0.4)]">
          <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-2xl font-black font-mono text-white">{focusScore}%</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase">FOCUS SCORE</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono text-slate-400 z-10">
        <span>ACTIVE SPRINT</span>
        <span className="text-amber-400 font-bold">24:59 REMAINING</span>
      </div>
    </div>
  );
}
