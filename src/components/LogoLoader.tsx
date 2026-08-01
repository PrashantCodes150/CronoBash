"use client";

import React from 'react';

interface LogoLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export default function LogoLoader({
  text = 'Entering Arena...',
  size = 'md',
  className = '',
}: LogoLoaderProps) {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    full: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-4 select-none ${className}`}>
      {/* Animated Glowing Logo Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Pulsing Orange Aura */}
        <div className="absolute inset-0 bg-[#FF5500]/30 rounded-full blur-2xl animate-pulse" />
        
        {/* Shimmering Outer Ring */}
        <div className="absolute -inset-3 rounded-full border border-[#FF5500]/30 animate-ping opacity-30" />

        {/* Floating Pulsing Logo Image */}
        <img
          src="/cronobash-icon.webp"
          alt="CronoBash Loading"
          className={`${iconSizes[size]} object-contain animate-bounce relative z-10 drop-shadow-[0_0_20px_rgba(255,85,0,0.4)]`}
          style={{ animationDuration: '1.8s' }}
        />
      </div>

      {/* Brand Text + Subtitle */}
      <div className="text-center space-y-1 z-10">
        <div className="text-xl sm:text-2xl font-black tracking-tight text-[#334155]" style={{ fontFamily: "'Syne', sans-serif" }}>
          CronoBash
        </div>
        {text && (
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1 font-mono">
            <span>{text}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (size === 'full') {
    return (
      <div className="fixed inset-0 bg-[#FAFAFC]/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
