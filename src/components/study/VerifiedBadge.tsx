"use client";

import React from 'react';

interface VerifiedBadgeProps {
  level?: number;
  size?: 'sm' | 'md' | 'lg';
  showLevelNumber?: boolean;
  className?: string;
}

export function VerifiedBadge({
  level = 1,
  size = 'sm',
  showLevelNumber = true,
  className = ''
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-6 h-6 text-xs'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  // Color scheme based on level brackets
  let badgeGradient = 'from-sky-500 to-blue-600 shadow-blue-500/50'; // Default Twitter / Insta blue
  let glowColor = 'rgba(59, 130, 246, 0.6)';

  if (level >= 80) {
    badgeGradient = 'from-amber-400 to-yellow-600 shadow-amber-500/50'; // Gold Overlord
    glowColor = 'rgba(245, 158, 11, 0.7)';
  } else if (level >= 50) {
    badgeGradient = 'from-purple-500 to-pink-600 shadow-purple-500/50'; // Cyber Master
    glowColor = 'rgba(168, 85, 247, 0.7)';
  } else if (level >= 20) {
    badgeGradient = 'from-emerald-400 to-teal-600 shadow-emerald-500/50'; // Emerald Elite
    glowColor = 'rgba(16, 185, 129, 0.7)';
  }

  return (
    <div
      className={`inline-flex items-center gap-1 font-mono align-middle ${className}`}
      title={`Level ${level} Verified Arena Fighter`}
    >
      <div 
        className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr ${badgeGradient} text-white font-bold shadow-md shrink-0 ${sizeClasses[size]}`}
        style={{ boxShadow: `0 0 8px ${glowColor}` }}
      >
        {/* Checkmark SVG */}
        <svg
          className={`${iconSizes[size]} fill-current stroke-current stroke-2`}
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>

      {showLevelNumber && (
        <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-tighter">
          Lv.{level}
        </span>
      )}
    </div>
  );
}

export default VerifiedBadge;
