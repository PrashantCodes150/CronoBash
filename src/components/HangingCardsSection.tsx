"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface HangingCardsSectionProps {
  children?: React.ReactNode;
}

export default function HangingCardsSection({ children }: HangingCardsSectionProps) {
  // Exact 3-column card attachment configuration (xPosition & synchronized Y keyframes locked to main cable)
  const attachments = [
    {
      x: 240, // Card 1 center
      yKeyframes: [26, 18, 24, 26],
      pathKeyframes: [
        "M 240 26 Q 244 38, 240 50",
        "M 240 18 Q 236 34, 240 50",
        "M 240 24 Q 245 37, 240 50",
        "M 240 26 Q 244 38, 240 50",
      ]
    },
    {
      x: 720, // Card 2 center
      yKeyframes: [20, 26, 16, 20],
      pathKeyframes: [
        "M 720 20 Q 715 35, 720 50",
        "M 720 26 Q 724 38, 720 50",
        "M 720 16 Q 716 33, 720 50",
        "M 720 20 Q 715 35, 720 50",
      ]
    },
    {
      x: 1200, // Card 3 center
      yKeyframes: [21, 25, 18, 21],
      pathKeyframes: [
        "M 1200 21 Q 1205 35, 1200 50",
        "M 1200 25 Q 1195 37, 1200 50",
        "M 1200 18 Q 1204 34, 1200 50",
        "M 1200 21 Q 1205 35, 1200 50",
      ]
    }
  ];

  return (
    <div className="relative w-full pt-8 pb-4">
      
      {/* ── SINGLE TOP HORIZONTAL ELECTRIC ORANGE VIBRATING CABLE ── */}
      <div className="relative w-full h-12 overflow-visible pointer-events-none select-none z-30">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 1440 50"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="singleStringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.3" />
              <stop offset="10%" stopColor="#FF5500" stopOpacity="1" />
              <stop offset="50%" stopColor="#FF7700" stopOpacity="1" />
              <stop offset="90%" stopColor="#FF5500" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF5500" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Main Top Horizontal Cable */}
          <motion.path
            d="M 0 22 Q 360 32, 720 20 T 1440 22"
            fill="none"
            stroke="url(#singleStringGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#orangeGlow)"
            animate={{
              d: [
                "M 0 22 Q 360 32, 720 20 T 1440 22",
                "M 0 22 Q 360 16, 720 26 T 1440 22",
                "M 0 22 Q 360 28, 720 16 T 1440 22",
                "M 0 22 Q 360 32, 720 20 T 1440 22",
              ]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Synchronized Locked Vertical Drop Strings */}
          {attachments.map((item, idx) => (
            <g key={idx}>
              {/* Vertical String attached to Cable */}
              <motion.path
                d={item.pathKeyframes[0]}
                fill="none"
                stroke="#FF5500"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#orangeGlow)"
                animate={{
                  d: item.pathKeyframes
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Cable Joint Knot Circle - Locked on Cable Path */}
              <motion.circle
                cx={item.x}
                cy={item.yKeyframes[0]}
                r={4}
                fill="#FF5500"
                stroke="#FFFFFF"
                strokeWidth={1.8}
                animate={{
                  cy: item.yKeyframes
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* ── CARDS WRAPPER WITH WIND SWAYING MOTION ── */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

/** Individual Hanging Card Container that bobs and sways smoothly */
export function HangingCardItem({
  children,
  index = 0,
  className = ''
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      style={{ transformOrigin: 'top center' }}
      animate={{
        rotate: [
          (index % 2 === 0 ? -1.5 : 1.5),
          (index % 2 === 0 ? 1.5 : -1.5),
          (index % 2 === 0 ? -1.0 : 1.0),
          (index % 2 === 0 ? -1.5 : 1.5),
        ],
        y: [0, 5, -2, 3, 0],
      }}
      transition={{
        duration: 4.0 + index * 0.5,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
      }}
      className={`relative ${className}`}
    >
      {/* ── PUNCHED HOLE (GROMMET) & 2-ROUND ORANGE STRING LOOP WRAP ── */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none select-none">
        
        {/* Double Orange String Loop (2 rounds threaded) */}
        <div className="relative w-6 h-3.5 -mb-2 flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 24 14">
            {/* Round 1 Loop */}
            <path
              d="M 5 12 C 5 1, 19 1, 19 12"
              fill="none"
              stroke="#FF5500"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Round 2 Loop */}
            <path
              d="M 8 13 C 8 3, 16 3, 16 13"
              fill="none"
              stroke="#FF7700"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Grommet / Punched Metal Ring Hole */}
        <div className="w-4.5 h-4.5 rounded-full bg-slate-900 border-2 border-slate-300 shadow-md flex items-center justify-center relative z-10">
          <div className="w-2 h-2 rounded-full bg-slate-950 shadow-inner border border-slate-700" />
        </div>
      </div>

      {children}
    </motion.div>
  );
}
