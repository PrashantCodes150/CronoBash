"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, Share2, Award, Clock, EyeOff, Skull, AlertCircle } from 'lucide-react';
import { AISummaryCard } from './AISummaryCard';

interface Standing {
  userId: string;
  userName: string;
  avatarUrl?: string;
  focusSeconds: number;
  distractionCount: number;
  focusScore: number;
  rank: number;
  isForfeit?: boolean;
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
  const loser = standings.find(s => s.rank > 1) || (standings.length > 1 ? standings[1] : null);

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
    const text = `🏆 Locked in on CogniSweep Study Arena! Focused for ${formatTime(winner?.focusSeconds || 0)} inside ${roomName}. Beat the clock with Antigravity focus!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start p-4 md:p-8 font-sans text-white">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mt-6">
        
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40 uppercase font-bold">
            MATCH CONCLUDED
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-sans mt-2 tracking-tight">
            Focus Duel Results
          </h1>
          <p className="text-sm text-neutral-400 font-mono">
            Sprint settled inside <span className="text-emerald-400 font-semibold">{roomName}</span>
          </p>
        </motion.div>

        {/* 1v1 Side-by-Side Winner & Loser Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
          {/* WINNER CARD */}
          {winner && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-emerald-950/40 via-neutral-900 to-neutral-950 border-2 border-emerald-500/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-emerald-500/5 to-transparent pointer-events-none" />

              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/80 px-4 py-1 rounded-full border border-amber-500/50 font-mono font-bold tracking-wider shadow-lg">
                <Trophy className="w-4 h-4 fill-amber-400" />
                <span>WINNER 🏆</span>
              </div>

              <div className="mt-5 flex flex-col items-center">
                {winner.avatarUrl ? (
                  <img src={winner.avatarUrl} alt={winner.userName} className="w-20 h-20 rounded-full border-4 border-emerald-400 object-cover shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-800 border-4 border-emerald-400 flex items-center justify-center text-white font-black text-2xl">
                    {winner.userName.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <h2 className="text-xl font-black text-white mt-3">{winner.userName}</h2>
                <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1">Focus Score: {winner.focusScore.toFixed(0)}%</p>

                <div className="grid grid-cols-2 gap-3 w-full mt-4 text-left font-mono">
                  <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-bold">FOCUS TIME</span>
                    <span className="text-xs font-bold text-emerald-300 block mt-0.5">{formatTime(winner.focusSeconds)}</span>
                  </div>
                  <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-bold">STRIKES</span>
                    <span className="text-xs font-bold text-red-400 block mt-0.5">{winner.distractionCount} / 5</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LOSER CARD */}
          {loser && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-b from-red-950/30 via-neutral-900 to-neutral-950 border-2 border-red-500/40 p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col items-center text-center opacity-90"
            >
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/80 px-4 py-1 rounded-full border border-red-500/50 font-mono font-bold tracking-wider shadow-lg">
                <Skull className="w-4 h-4 text-red-400" />
                <span>{loser.isForfeit ? 'LOSER 💀 (FORFEIT)' : 'LOSER 💀'}</span>
              </div>

              <div className="mt-5 flex flex-col items-center">
                {loser.avatarUrl ? (
                  <img src={loser.avatarUrl} alt={loser.userName} className="w-20 h-20 rounded-full border-4 border-red-500/60 object-cover shadow-xl grayscale" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-800 border-4 border-red-500/60 flex items-center justify-center text-neutral-400 font-black text-2xl">
                    {loser.userName.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <h2 className="text-xl font-black text-neutral-300 mt-3">{loser.userName}</h2>
                <p className="text-[10px] text-red-400 font-mono font-bold mt-1">
                  {loser.isForfeit ? 'Match Restarted / Abandoned' : `Focus Score: ${loser.focusScore.toFixed(0)}%`}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mt-4 text-left font-mono">
                  <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-bold">FOCUS TIME</span>
                    <span className="text-xs font-bold text-neutral-300 block mt-0.5">{formatTime(loser.focusSeconds)}</span>
                  </div>
                  <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 block font-bold">STRIKES</span>
                    <span className="text-xs font-bold text-red-400 block mt-0.5">{loser.distractionCount} / 5</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Full Standings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-md mt-8 text-left font-mono"
        >
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase">
              <Award className="w-4 h-4 text-emerald-400" />
              Official Standings
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase font-bold">RANKED BY PERFORMANCE</span>
          </div>

          <div className="divide-y divide-neutral-900">
            {standings.map((player) => (
              <div key={player.userId} className="px-6 py-3.5 flex items-center justify-between hover:bg-neutral-850 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 py-0.5 text-center font-bold text-xs rounded border ${
                    player.rank === 1 
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' 
                      : 'bg-red-950/60 border-red-500/40 text-red-400'
                  }`}>
                    {player.rank === 1 ? 'WIN' : 'LOSS'}
                  </span>
                  <div>
                    <span className="font-bold text-white block text-sm">{player.userName}</span>
                    <span className="text-[10px] text-neutral-400">Score: {player.focusScore.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase font-bold">TIME</span>
                    <span className="text-neutral-300">{formatTime(player.focusSeconds)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase font-bold">STRIKES</span>
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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all hover:scale-105 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Rematch
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs uppercase font-bold tracking-wider transition-all hover:scale-105 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Share2 className="w-4 h-4 fill-black" />
            Share Result
          </button>

          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-red-950/40 hover:border-red-900 text-neutral-400 hover:text-red-400 font-mono text-xs uppercase font-bold tracking-wider transition-all hover:scale-105 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Exit Lobby
          </button>
        </motion.div>

      </div>
    </div>
  );
}
