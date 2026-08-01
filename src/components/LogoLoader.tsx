"use client";

import React from 'react';

interface LogoLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export default function LogoLoader({
  size = 'md',
  className = '',
}: LogoLoaderProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    full: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Animated Glowing Logo Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Pulsing Orange Aura */}
        <div className="absolute inset-0 bg-[#FF5500]/30 rounded-full blur-2xl animate-pulse" />
        
        {/* Shimmering Outer Ring 1 */}
        <div className="absolute -inset-4 rounded-full border border-[#FF5500]/40 animate-ping opacity-40" style={{ animationDuration: '2s' }} />

        {/* Shimmering Outer Ring 2 */}
        <div className="absolute -inset-2 rounded-full border border-[#FF5500]/20 animate-pulse" />

        {/* Floating Pulsing Logo Image */}
        <img
          src="/cronobash-icon.webp"
          alt="Loading..."
          className={`${iconSizes[size]} object-contain animate-bounce relative z-10 drop-shadow-[0_0_25px_rgba(255,85,0,0.5)]`}
          style={{ animationDuration: '1.6s' }}
        />
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
