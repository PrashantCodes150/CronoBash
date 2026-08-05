"use client";

import React from 'react';

interface CronoBashLogoIconProps {
  className?: string;
  size?: number | string;
}

export default function CronoBashLogoIcon({ className = "", size }: CronoBashLogoIconProps) {
  const fontSizeStyle = size ? { fontSize: typeof size === 'number' ? `${size}px` : size } : undefined;

  return (
    <span
      className={`text-[28px] text-black leading-none select-none ${className}`}
      style={{ fontFamily: '"Special Elite", serif', fontWeight: 400, ...fontSizeStyle }}
    >
      CronoBash
    </span>
  );
}
