"use client";

import React from 'react';

interface VerifiedBadgeProps {
  level?: number;
  followersCount?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLevelNumber?: boolean;
  className?: string;
}

export function VerifiedBadge({
  level = 1,
  followersCount = 0,
  isVerified = false,
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

  // Explicit rule: The Blue Verified Checkmark is ONLY awarded to users with at least 1,000,000 (1 Million) followers!
  const hasOneMillionFollowers = (followersCount && followersCount >= 1000000) || isVerified === true;

  if (!hasOneMillionFollowers) {
    if (!showLevelNumber) return null;
    return (
      <span className={`font-mono font-bold text-neutral-400 text-[10px] ${className}`}>
        Lv.{level}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 font-mono align-middle ${className}`}
      title={`Official Blue Verified Celebrity (1M+ Followers) - Level ${level}`}
    >
      <div 
        className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold shadow-md shrink-0 ${sizeClasses[size]}`}
        style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.7)' }}
      >
        {/* Twitter / Instagram Blue Checkmark SVG */}
        <svg
          className={`${iconSizes[size]} fill-current stroke-current stroke-2`}
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>

      {showLevelNumber && (
        <span className="text-[10px] font-bold text-sky-400 font-mono tracking-tighter">
          Lv.{level}
        </span>
      )}
    </div>
  );
}

export default VerifiedBadge;
