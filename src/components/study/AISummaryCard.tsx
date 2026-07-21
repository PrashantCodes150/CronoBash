"use client";

import React from 'react';
import { Target, AlertTriangle, Lightbulb } from 'lucide-react';

interface AISummaryCardProps {
  summary: {
    good: string;
    improve: string;
    tip: string;
  };
}

export function AISummaryCard({ summary }: AISummaryCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 font-mono text-xs space-y-4 text-white">
      <div className="border-b border-neutral-800 pb-2 flex items-center gap-2 text-orange-500">
        <span className="text-[10px] font-black uppercase tracking-wider">AI Study Coach Diagnostics</span>
      </div>

      <div className="space-y-3">
        {/* Good points */}
        <div className="flex items-start gap-2.5">
          <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-neutral-300 leading-relaxed">{summary.good}</p>
        </div>

        {/* Areas of improvement */}
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-neutral-300 leading-relaxed">{summary.improve}</p>
        </div>

        {/* Tip recommendations */}
        <div className="flex items-start gap-2.5 bg-black/40 border border-neutral-850 p-3 rounded-lg">
          <Lightbulb className="w-4 h-4 text-yellow-450 shrink-0 mt-0.5" />
          <p className="text-neutral-400 leading-relaxed">{summary.tip}</p>
        </div>
      </div>
    </div>
  );
}
