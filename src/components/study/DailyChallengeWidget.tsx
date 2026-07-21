"use client";

import React from 'react';
import Link from 'next/link';
import { Target, ChevronRight } from 'lucide-react';

interface DailyChallengeWidgetProps {
  title: string;
  targetMinutes: number;
  currentMinutes: number;
}

export function DailyChallengeWidget({ title, targetMinutes, currentMinutes }: DailyChallengeWidgetProps) {
  const remaining = Math.max(0, targetMinutes - currentMinutes);
  const percent = Math.min(100, Math.floor((currentMinutes / targetMinutes) * 100));

  return (
    <Link 
      href="/challenges"
      className="block bg-neutral-900 hover:bg-neutral-850 transition border border-neutral-800 p-4 rounded-xl text-white select-none shadow-md hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Active Quest</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500" />
      </div>

      <div className="mt-3">
        <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{title}</h4>
        <p className="text-[11px] text-neutral-450 mt-1">
          {remaining > 0 ? `${remaining} minutes remaining to complete!` : 'Quest complete! Claim your reward.'}
        </p>
      </div>

      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-3.5">
        <div 
          className="bg-orange-500 h-full rounded-full transition-all duration-500" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  );
}
