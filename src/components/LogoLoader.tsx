"use client";

import React from 'react';

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
  const content = (
    <div className={`flex flex-col items-center justify-center select-none gap-3 ${className}`}>
      {/* Animated Pulsing Special Elite Text Logo */}
      <div className="relative flex items-center justify-center px-4 py-2">
        {/* Soft Ambient Pulsing Aura */}
        <div className="absolute inset-0 bg-slate-900/10 rounded-full blur-xl animate-pulse" />
        
        {/* Signature Special Elite cronobash wordmark */}
        <span
          className="text-[32px] sm:text-[42px] text-black leading-none select-none animate-pulse relative z-10 drop-shadow-xs tracking-tight"
          style={{ fontFamily: '"Special Elite", serif', fontWeight: 400, animationDuration: '1.2s' }}
        >
          CronoBash
        </span>
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
