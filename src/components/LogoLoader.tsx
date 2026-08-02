"use client";

import React from 'react';
import CronoBashLogoIcon from './CronoBashLogoIcon';

interface LogoLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export default function LogoLoader({
  text,
  size = 'md',
  className = '',
}: LogoLoaderProps) {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    full: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center select-none gap-4 ${className}`}>
      {/* Animated Glowing Logo Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Pulsing Orange Aura */}
        <div className="absolute inset-0 bg-[#FF5500]/30 rounded-full blur-2xl animate-pulse" />
        
        {/* Shimmering Outer Ring 1 */}
        <div className="absolute -inset-4 rounded-full border border-[#FF5500]/40 animate-ping opacity-40" style={{ animationDuration: '2s' }} />

        {/* Shimmering Outer Ring 2 */}
        <div className="absolute -inset-2 rounded-full border border-[#FF5500]/25 animate-pulse" />

        {/* Floating Pulsing Logo Image */}
        <img
          src="/cronobash-icon.webp"
          alt="CronoBash Loading..."
          className={`${iconSizes[size]} object-contain animate-bounce relative z-10 drop-shadow-[0_0_25px_rgba(255,85,0,0.6)]`}
          style={{ animationDuration: '1.4s' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/cronobash-icon.png';
          }}
        />
      </div>

      {text && (
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 animate-pulse font-mono">
          {text}
        </span>
      )}
    </div>
  );

  if (size === 'full') {
    return (
      <div className="fixed inset-0 bg-[#FAFAFC]/95 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
