"use client";

import React from 'react';
import { motion } from 'framer-motion';
import './vs-line.css';

export function VSDivider() {
  return (
    <div className="vs-divider flex flex-col items-center justify-center my-2 md:my-0">
      <motion.div
        className="vs-line w-full md:w-0.5 h-0.5 md:h-full bg-gradient-to-b from-amber-500 via-rose-500 to-cyan-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="vs-badge bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 text-white font-black text-sm px-3.5 py-1.5 rounded-full border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse tracking-widest uppercase">
        VS
      </div>
    </div>
  );
}
