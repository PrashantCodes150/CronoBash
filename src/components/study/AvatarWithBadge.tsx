"use client";

import React from 'react';
import { BADGES } from '@/lib/badges';
import { BadgeDisplay } from './BadgeDisplay';

interface AvatarWithBadgeProps {
  avatarUrl?: string;
  name?: string;
  level?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarWithBadge({
  avatarUrl,
  name = 'Fighter',
  level = 1,
  isVerified = false,
  size = 'md',
  className = '',
}: AvatarWithBadgeProps) {
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  // Exact Anchored Bottom-Right Badge Overlay Position
  const badgeWrapperSizes = {
    sm: 'w-4 h-4 -bottom-0.5 -right-0.5',
    md: 'w-5 h-5 -bottom-0.5 -right-0.5',
    lg: 'w-6.5 h-6.5 -bottom-1 -right-1',
    xl: 'w-9 h-9 -bottom-1.5 -right-1.5',
  }[size];

  const currentBadge = BADGES[Math.max(0, Math.min(level - 1, BADGES.length - 1))] || BADGES[0];
  const hoverTooltipText = `${currentBadge.name} • Level ${currentBadge.reqLevel} Badge: ${currentBadge.description}`;

  return (
    <div className={`relative inline-block shrink-0 ${containerSizes} ${className}`}>
      {/* Full-Visibility Avatar Image Frame */}
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm">
        <img
          src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight'}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Anchored Bottom-Right Real Won 3D Vector SVG Emblem Medal with Hover Details Popover */}
      <div
        className={`absolute z-10 flex items-center justify-center filter drop-shadow-md rounded-full bg-white p-0.5 group/avatarbadge cursor-pointer ${badgeWrapperSizes}`}
        title={hoverTooltipText}
      >
        {isVerified ? (
          // Verified Blue Checkmark Badge
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 border border-white flex items-center justify-center shadow-sm">
            <svg className="w-2.5 h-2.5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        ) : (
          // Exact Real 3D Vector SVG Emblem Medal Won By User!
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <BadgeDisplay badge={currentBadge} isUnlocked={true} size="sm" />
          </div>
        )}

        {/* Hover Floating Details Card Popover */}
        <div className="absolute left-full ml-2 bottom-0 w-56 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl opacity-0 group-hover/avatarbadge:opacity-100 transition-opacity pointer-events-none z-50 space-y-1.5 border border-slate-800 text-left">
          <div className="flex items-center gap-2">
            <BadgeDisplay badge={currentBadge} isUnlocked={true} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{currentBadge.name}</p>
              <span className="text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                Level {currentBadge.reqLevel} Badge ✓
              </span>
            </div>
          </div>
          <p className="text-[9px] text-slate-300 font-medium leading-normal line-clamp-2">
            {currentBadge.description}
          </p>
        </div>
      </div>
    </div>
  );
}
