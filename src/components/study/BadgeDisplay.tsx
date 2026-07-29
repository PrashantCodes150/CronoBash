"use client";

import React from 'react';
import { Badge } from '@/lib/badges';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isUnlocked?: boolean;
}

export function BadgeDisplay({ badge, size = 'md', isUnlocked = true }: BadgeDisplayProps) {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  // Color theme definitions for SVG gradients & glows
  const colorGradients: Record<string, { start: string; end: string; accent: string }> = {
    "from-[#00ffa3] to-[#00b8ff]": { start: '#00FFA3', end: '#00B8FF', accent: '#00E5FF' },
    "from-[#ffaa00] to-[#ff0055]": { start: '#FFAA00', end: '#FF0055', accent: '#FF5A1F' },
    "from-[#a020f0] to-[#ff00ff]": { start: '#A020F0', end: '#FF00FF', accent: '#D8B4FE' },
    "from-[#00f2fe] to-[#4facfe]": { start: '#00F2FE', end: '#4FACFE', accent: '#38BDF8' },
    "from-[#f857a6] to-[#ff5858]": { start: '#F857A6', end: '#FF5858', accent: '#FB7185' },
    "from-[#11998e] to-[#38ef7d]": { start: '#11998E', end: '#38EF7D', accent: '#34D399' },
    "from-[#ffe259] to-[#ffa751]": { start: '#FFE259', end: '#FFA751', accent: '#FBBF24' },
    "from-[#3a7bd5] to-[#3a6073]": { start: '#3A7BD5', end: '#3A6073', accent: '#60A5FA' },
    "from-[#ec008c] to-[#fc6767]": { start: '#EC008C', end: '#FC6767', accent: '#F43F5E' },
    "from-[#141e30] to-[#243b55]": { start: '#6366F1', end: '#1E1B4B', accent: '#818CF8' }
  };

  const theme = colorGradients[badge.color] || { start: '#3B82F6', end: '#1E3A8A', accent: '#60A5FA' };
  const gradId = `badge_grad_${badge.id}_${size}`;
  const silverGradId = `badge_silver_${badge.id}_${size}`;

  // Unique SVG Path Shapes
  const renderShapePath = () => {
    switch (badge.shape) {
      case 'hexagon':
        return <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" />;
      case 'octagon':
        return <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" />;
      case 'shield':
        return <path d="M50,5 L90,20 L90,55 C90,75 70,90 50,98 C30,90 10,75 10,55 L10,20 Z" />;
      case 'diamond':
        return <polygon points="50,5 95,50 50,95 5,50" />;
      case 'star':
        return <polygon points="50,5 63,35 95,38 71,60 78,92 50,75 22,92 29,60 5,38 37,35" />;
      case 'crown':
        return <polygon points="10,85 10,35 30,55 50,15 70,55 90,35 90,85" />;
      case 'flame':
        return <path d="M50,5 C65,25 90,40 90,65 C90,82 72,95 50,95 C28,95 10,82 10,65 C10,40 35,25 50,5 Z" />;
      case 'banner':
        return <polygon points="15,5 85,5 85,95 50,80 15,95" />;
      default:
        return <circle cx="50" cy="50" r="45" />;
    }
  };

  const tooltipText = `${badge.name} • Level ${badge.reqLevel} Badge: ${badge.description}`;

  return (
    <div
      className={`relative ${dimensions} flex items-center justify-center shrink-0 group/badge cursor-pointer`}
      title={tooltipText}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transition-all duration-300 ${
          isUnlocked ? 'filter drop-shadow-md group-hover/badge:scale-110' : 'opacity-40 grayscale'
        }`}
      >
        <defs>
          {/* Main Metallic/Vibrant Badge Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? theme.start : '#64748B'} />
            <stop offset="100%" stopColor={isUnlocked ? theme.end : '#334155'} />
          </linearGradient>

          {/* Outer Border Bevel Gradient */}
          <linearGradient id={silverGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor={isUnlocked ? theme.accent : '#94A3B8'} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer Shadow Ring */}
        <g stroke={isUnlocked ? theme.accent : '#475569'} strokeWidth="3" fill="none" opacity="0.3">
          {renderShapePath()}
        </g>

        {/* Base Shape with Metallic Border */}
        <g fill={`url(#${gradId})`} stroke={`url(#${silverGradId})`} strokeWidth="4" strokeLinejoin="round">
          {renderShapePath()}
        </g>

        {/* Inner Embedded Emblem Ring */}
        <circle cx="50" cy="50" r="28" fill="#0F172A" fillOpacity="0.4" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Shine Reflection Overlay */}
        <path
          d="M 25 20 Q 50 10 75 20 Q 50 35 25 20"
          fill="#FFFFFF"
          fillOpacity={isUnlocked ? "0.25" : "0.08"}
        />

        {/* Material Symbol Icon or Level Number */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={badge.reqLevel >= 100 ? "16" : "18"}
          fontWeight="900"
          fontFamily="sans-serif"
          className="select-none font-black"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
        >
          {badge.reqLevel}
        </text>

        {/* Top Metallic Star Badge Accent */}
        <polygon points="50,12 52,18 58,18 53,21 55,27 50,23 45,27 47,21 42,18 48,18" fill="#FFD700" opacity={isUnlocked ? "0.9" : "0.3"} />
      </svg>

      {/* Lock Indicator for locked badges */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-[1px]">
          <span className="material-symbols-outlined text-white text-xs font-black">lock</span>
        </div>
      )}
    </div>
  );
}
