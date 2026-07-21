"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, CheckCircle2 } from 'lucide-react';

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    reward_coins: number;
    badge_name: string;
    target_minutes: number;
    completed: boolean;
  };
  progress: number; // current minutes focused
  claimed: boolean;
  onClaim: (id: string) => void;
}

export function ChallengeCard({ challenge, progress, claimed, onClaim }: ChallengeCardProps) {
  const percent = Math.min(100, Math.floor((progress / challenge.target_minutes) * 100));
  const isFinished = progress >= challenge.target_minutes;

  return (
    <div className="bg-neutral-905 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between text-white relative overflow-hidden">
      {/* Complete Check overlay badge */}
      {isFinished && (
        <div className="absolute top-2 right-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full p-1 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest block mb-1">
          {challenge.badge_name}
        </span>
        <h4 className="text-sm font-extrabold text-white">{challenge.title}</h4>
        <p className="text-[11px] text-neutral-455 mt-1 leading-relaxed">{challenge.description}</p>
      </div>

      {/* Progress slider */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mb-1.5">
          <span>Sprint progress</span>
          <span>{progress}/{challenge.target_minutes} mins</span>
        </div>
        <div className="w-full bg-neutral-850 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8 }}
            className="bg-orange-500 h-full rounded-full"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-5 border-t border-neutral-850 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-mono font-bold">
          <Coins className="w-4 h-4" />
          <span>+{challenge.reward_coins} Coins</span>
        </div>

        {claimed ? (
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Claimed ✅</span>
        ) : (
          <button
            onClick={() => onClaim(challenge.id)}
            disabled={!isFinished}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition ${
              isFinished 
                ? 'bg-orange-500 hover:bg-orange-655 text-white shadow shadow-orange-500/30' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-750'
            }`}
          >
            Claim Reward
          </button>
        )}
      </div>
    </div>
  );
}
