"use client";

import React from 'react';
import { motion } from 'framer-motion';
import './vs-line.css';

export function VSDivider() {
  return (
    <div className="vs-divider">
      <motion.div
        className="vs-line"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <div className="vs-badge">VS</div>
    </div>
  );
}
