"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Share2, Award, Clock, EyeOff } from 'lucide-react';
import { AISummaryCard } from './AISummaryCard';

interface Standing {
  userId: string;
  userName: string;
  avatarUrl?: string;
  focusSeconds: number;
  distractionCount: number;
  focusScore: number;
  rank: number;
  rewardCoins?: number;
  rewardCash?: number;
}

interface CelebrationScreenProps {
  roomName: string;
  roomType: 'public' | 'private' | 'money';
  standings: Standing[];
  onRematch: () => void;
  onLeave: () => void;
  summary?: {
    good: string;
    improve: string;
    tip: string;
  };
}

export default function CelebrationScreen({
  roomName,
  roomType,
  standings,
  onRematch,
  onLeave,
  summary
}: CelebrationScreenProps) {
  const winner = standings.find(s => s.rank === 1) || standings[0];

  useEffect(() => {
    // Fire confetti bursts (Optimized performance: 3s limit, 100 particles max)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      // Cap particles at ~35 per burst to stay well under 100 total particles
      const particleCount = Math.floor(35 * (timeLeft / duration));
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.15, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.85), y: Math.random() - 0.2 } });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const handleShare = () => {
    const text = `🏆 Locked in on CogniSweep Study Arena! Focused for ${formatTime(winner.focusSeconds)} inside ${roomName}. Beat the clock with Antigravity focus!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start p-4 md:p-8">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mt-6">
        
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40">
            SESSION CONCLUDED
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-sans mt-2">
            Focus Celebration!
          </h1>
          <p className="text-sm text-neutral-400">
            Sprint completed successfully in <span className="text-white font-semibold">{roomName}</span>
          </p>
        </motion.div>

        {/* Winner Spotlight Card */}
        {winner && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/30 p-6 rounded-2xl shadow-xl mt-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-500/5 to-transparent pointer-events-none" />

            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-xs text-amber-400 bg-amber-950/50 px-3 py-0.5 rounded-full border border-amber-800/40">
              <Trophy className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold font-mono">CHAMPION</span>
            </div>

            <div className="flex flex-col items-center mt-6">
              {winner.avatarUrl ? (
                <img src={winner.avatarUrl} alt={winner.userName} className="w-24 h-24 rounded-full border-4 border-amber-500 object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neutral-800 border-4 border-amber-500 flex items-center justify-center text-white font-bold text-3xl">
                  {winner.userName.substring(0, 2).toUpperCase()}
                </div>
              )}

              <h2 className="text-2xl font-bold text-white mt-4">{winner.userName}</h2>
              <p className="text-xs text-neutral-400 font-mono mt-1">ID: {winner.userId.substring(0, 8)}</p>

              {(winner.rewardCoins || winner.rewardCash) && (
                <div className="flex gap-4 mt-4 bg-amber-500/10 border border-amber-500/25 px-4 py-2 rounded-xl">
                  {winner.rewardCoins && (
                    <div className="text-center">
                      <span className="block text-[10px] text-amber-400 font-mono">COINS</span>
                      <span className="text-lg font-black text-amber-300">+{winner.rewardCoins}</span>
                    </div>
                  )}
                  {winner.rewardCash && (
                    <div className="text-center">
                      <span className="block text-[10px] text-emerald-400 font-mono">WINNINGS</span>
                      <span className="text-lg font-black text-emerald-300">₹{winner.rewardCash}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-neutral-900 text-left">
                <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/40">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Focus Time</span>
                  </div>
                  <span className="block text-base font-bold text-white mt-1">
                    {formatTime(winner.focusSeconds)}
                  </span>
                </div>
                <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/40">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Strikes</span>
                  </div>
                  <span className="block text-base font-bold text-red-400 mt-1">
                    {winner.distractionCount} / 5
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md mt-8 text-left"
        >
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Lobby Rankings
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono">SORTED BY FOCUS SCORE</span>
          </div>

          <div className="divide-y divide-neutral-900">
            {standings.map((player) => (
              <div key={player.userId} className="px-6 py-3 flex items-center justify-between hover:bg-neutral-850 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold text-sm ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-neutral-300' : player.rank === 3 ? 'text-amber-700' : 'text-neutral-500'}`}>
                    #{player.rank}
                  </span>
                  <div>
                    <span className="font-medium text-white block text-sm">{player.userName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Score: {player.focusScore.toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">TIME</span>
                    <span className="text-neutral-300">{formatTime(player.focusSeconds)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">STRIKES</span>
                    <span className="text-red-400">{player.distractionCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {summary && (
          <div className="w-full max-w-2xl mt-8">
            <AISummaryCard summary={summary} />
          </div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8 mb-12"
        >
          {roomType !== 'money' && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-mono text-xs uppercase tracking-wider transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Rematch
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs uppercase tracking-wider transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share Result
          </button>

          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-neutral-950 border border-neutral-850 hover:bg-red-950/40 hover:border-red-900 text-neutral-400 hover:text-red-400 font-mono text-xs uppercase tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Lobby
          </button>
        </motion.div>

      </div>
    </div>
  );
}
