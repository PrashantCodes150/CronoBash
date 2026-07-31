"use client";

import React from 'react';

export default function MasteryMotivationalTickerSection() {
  const line1Items = [
    { text: "STOP STUDYING ALONE" },
    { text: "CONQUER YOUR GOALS", highlight: true },
    { text: "WITH REAL SQUAD SPRINT POWER", highlight: true },
    { text: "TURN FOCUS INTO VICTORY", highlight: true },
  ];

  const line2Items = [
    { text: "LOCK IN DEEP WORK", highlight: true },
    { text: "ELEVATE YOUR RANK FROM BRONZE TO OVERLORD", highlight: true },
    { text: "EARN CASH REWARDS FOR DISCIPLINE", highlight: true },
  ];

  const renderTrack1 = () => (
    <div className="flex items-center gap-8 shrink-0">
      <span>STOP STUDYING ALONE</span>
      <span className="text-slate-300">•</span>
      <span className="text-[#FF5500]">CONQUER YOUR GOALS</span>
      <span className="text-slate-300">•</span>
      <span>WITH <span className="text-[#FF5500]">REAL SQUAD SPRINT POWER</span></span>
      <span className="text-slate-300">•</span>
      <span>TURN FOCUS INTO <span className="text-[#FF5500]">VICTORY</span></span>
      <span className="text-slate-300 mr-8">✦</span>
    </div>
  );

  const renderTrack2 = () => (
    <div className="flex items-center gap-8 shrink-0">
      <span>LOCK IN <span className="text-[#FF5500]">DEEP WORK</span></span>
      <span className="text-slate-300">•</span>
      <span>ELEVATE YOUR RANK FROM <span className="text-[#FF5500]">BRONZE TO OVERLORD</span></span>
      <span className="text-slate-300">•</span>
      <span>EARN <span className="text-[#FF5500]">CASH REWARDS</span> FOR DISCIPLINE</span>
      <span className="text-slate-300 mr-8">✦</span>
    </div>
  );

  return (
    <section className="py-8 sm:py-10 border-y border-slate-200/70 bg-white/60 backdrop-blur-md relative z-20 overflow-hidden select-none">
      
      {/* 144 FPS GPU Hardware Accelerated Keyframes for Slow Silk Motion */}
      <style jsx global>{`
        @keyframes ticker-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes ticker-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .mastery-ticker-left {
          display: flex;
          width: max-content;
          animation: ticker-left 100s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .mastery-ticker-right {
          display: flex;
          width: max-content;
          animation: ticker-right 105s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>

      <div className="flex flex-col gap-3">
        
        {/* Line 1: Slow Left-to-Right Moving Track */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="mastery-ticker-right text-lg sm:text-2xl font-black text-[#334155] uppercase tracking-wider font-mono">
            {renderTrack1()}
            {renderTrack1()}
            {renderTrack1()}
            {renderTrack1()}
          </div>
        </div>

        {/* Line 2: Slow Right-to-Left Moving Track */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="mastery-ticker-left text-lg sm:text-2xl font-black text-[#334155] uppercase tracking-wider font-mono">
            {renderTrack2()}
            {renderTrack2()}
            {renderTrack2()}
            {renderTrack2()}
          </div>
        </div>

      </div>
    </section>
  );
}
