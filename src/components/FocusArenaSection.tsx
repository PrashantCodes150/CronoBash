"use client";

import { useMemo } from 'react';
import ScrollVideoCanvas from '@/components/ScrollVideoCanvas';
import { SQUAD_FRAMES_LIST } from '@/lib/squadFramesList';
import { ShieldAlert, Users, Zap, Eye } from 'lucide-react';

export default function FocusArenaSection() {
  const squadFrames = useMemo(() => SQUAD_FRAMES_LIST, []);

  return (
    <section id="focus-arena" className="relative overflow-hidden bg-slate-950 text-white">
      <div className="relative">
        <ScrollVideoCanvas
          frames={squadFrames}
          title=""
          subtitle=""
          showOverlay={false}
        />

        {/* High-Impact Overlay Content with Thick Bold Typography & Glass Container */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-start">
          <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 md:px-16 py-20 lg:py-28">
            <div className="max-w-2xl space-y-6 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/30 bg-sky-950/80 px-4 py-2 text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-300 font-extrabold backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                ⚡ MULTIPLAYER SQUAD TELEMETRY
              </div>

              {/* Ultra-Thick High-Impact Title */}
              <h2
                className="text-[clamp(2.75rem,5.5vw,5.5rem)] font-black uppercase tracking-tight leading-[0.95] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]"
                style={{ fontWeight: 900 }}
              >
                REAL-TIME SQUAD <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300">
                  FLOW ARENA
                </span>
              </h2>

              {/* Subheading / Description with thick readable font weight */}
              <p className="text-base sm:text-xl font-bold leading-relaxed text-slate-100/95 max-w-xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                Experience zero-friction squad focus. CronoBash synchronizes real-time gaze telemetry, timer intervals, and group momentum across live study rooms.
              </p>

              {/* Feature Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-lg pointer-events-auto">
                <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-md shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                    <Users className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-wide text-slate-100">
                    Live Squad Sync
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-md shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                    <Eye className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-wide text-slate-100">
                    Distraction Telemetry
                  </span>
                </div>
              </div>

              {/* Scroll Callout */}
              <div className="pt-3 flex items-center gap-3 text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-sky-300/90">
                <Zap className="w-4 h-4 text-sky-400 animate-bounce" />
                <span>Scroll to control the 3D frame sequence</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
