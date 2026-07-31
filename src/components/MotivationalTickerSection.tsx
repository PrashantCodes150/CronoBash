"use client";

import React from 'react';

export default function MotivationalTickerSection() {
  const line1Quotes = [
    { text: "WE ARE WHAT WE REPEATEDLY DO.", highlight: "EXCELLENCE IS NOT AN ACT, BUT A HABIT.", author: "ARISTOTLE" },
    { text: "YOU HAVE POWER OVER YOUR MIND.", highlight: "REALIZE THIS, AND YOU WILL FIND STRENGTH.", author: "MARCUS AURELIUS" },
    { text: "THE ONLY WAY TO DO GREAT WORK IS TO", highlight: "LOVE WHAT YOU DO.", author: "STEVE JOBS" },
  ];

  const line2Quotes = [
    { text: "REST AT THE END,", highlight: "NOT IN THE MIDDLE.", author: "KOBE BRYANT" },
    { text: "IT IS NOT THAT WE HAVE A SHORT TIME TO LIVE, BUT THAT", highlight: "WE WASTE A LOT OF IT.", author: "SENECA" },
    { text: "GENIUS IS 1% INSPIRATION AND", highlight: "99% PERSPIRATION.", author: "THOMAS EDISON" },
  ];

  const renderQuotesBlock = (quotes: typeof line1Quotes) => (
    <div className="flex items-center gap-8 shrink-0">
      {quotes.map((q, idx) => (
        <React.Fragment key={idx}>
          <span>
            &ldquo;{q.text} <span className="text-[#FF5500]">{q.highlight}</span>&rdquo; — {q.author}
          </span>
          <span className="text-slate-300">•</span>
        </React.Fragment>
      ))}
      <span className="text-slate-300 mr-8">✦</span>
    </div>
  );

  return (
    <section className="py-8 sm:py-10 border-y border-slate-200/70 bg-white/60 backdrop-blur-md relative z-20 overflow-hidden select-none">
      
      {/* 144 FPS GPU Hardware Accelerated Keyframes */}
      <style jsx global>{`
        @keyframes ticker-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes ticker-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .ticker-track-left {
          display: flex;
          width: max-content;
          animation: ticker-left 110s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .ticker-track-right {
          display: flex;
          width: max-content;
          animation: ticker-right 115s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>

      <div className="flex flex-col gap-3">
        
        {/* Line 1: Smooth Left-to-Right Moving Track */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="ticker-track-right text-lg sm:text-2xl font-black text-[#334155] uppercase tracking-wider font-mono">
            {/* 2 Duplicate Sets for 100% Imperceptible Smooth Infinite Loop */}
            {renderQuotesBlock(line1Quotes)}
            {renderQuotesBlock(line1Quotes)}
            {renderQuotesBlock(line1Quotes)}
            {renderQuotesBlock(line1Quotes)}
          </div>
        </div>

        {/* Line 2: Smooth Right-to-Left Moving Track */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="ticker-track-left text-lg sm:text-2xl font-black text-[#334155] uppercase tracking-wider font-mono">
            {/* 2 Duplicate Sets for 100% Imperceptible Smooth Infinite Loop */}
            {renderQuotesBlock(line2Quotes)}
            {renderQuotesBlock(line2Quotes)}
            {renderQuotesBlock(line2Quotes)}
            {renderQuotesBlock(line2Quotes)}
          </div>
        </div>

      </div>
    </section>
  );
}
