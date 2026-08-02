"use client";

import React from 'react';

interface CronoBashLogoIconProps {
  className?: string;
  size?: number | string;
}

export default function CronoBashLogoIcon({ className = "w-8 h-8", size }: CronoBashLogoIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Top-Left Amber-Orange Lightning Gradient */}
        <linearGradient id="cronoBoltGradientTop" x1="10" y1="10" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB800" />
          <stop offset="40%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#E60000" />
        </linearGradient>

        {/* Bottom-Right Deep Purple-Navy Gradient */}
        <linearGradient id="cronoBoltGradientBottom" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7000FF" />
          <stop offset="60%" stopColor="#2E0080" />
          <stop offset="100%" stopColor="#0F0038" />
        </linearGradient>

        {/* Purple Accent Dot Gradient */}
        <linearGradient id="cronoDotGradient" x1="60" y1="10" x2="85" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9E00FF" />
          <stop offset="100%" stopColor="#3A0080" />
        </linearGradient>
      </defs>

      {/* Top-Right Floating Purple Orb Dot */}
      <circle cx="75" cy="20" r="10" fill="url(#cronoDotGradient)" />

      {/* Bottom-Left Floating Purple Dot */}
      <circle cx="28" cy="60" r="7" fill="url(#cronoDotGradient)" />

      {/* Main Curved Lightning Bolt Body (Purple Shadow Base) */}
      <path
        d="M 45 22 C 60 22, 75 35, 78 50 C 82 66, 75 80, 58 84 C 45 87, 35 80, 38 72 C 40 66, 52 50, 72 38 Z"
        fill="url(#cronoBoltGradientBottom)"
      />

      {/* Main Sharp Electric Orange Lightning Bolt Foreground */}
      <path
        d="M 52 8 C 40 8, 25 18, 20 32 C 16 43, 22 50, 32 50 C 44 50, 58 35, 68 28 L 52 38 C 45 42, 42 48, 38 60 C 35 70, 38 76, 48 68 C 60 58, 68 45, 72 38 C 76 34, 70 28, 60 28 L 68 18 C 70 14, 62 8, 52 8 Z"
        fill="url(#cronoBoltGradientTop)"
      />
    </svg>
  );
}
