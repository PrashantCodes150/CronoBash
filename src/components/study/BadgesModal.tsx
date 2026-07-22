"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES } from '@/lib/badges';
import { VerifiedBadge } from './VerifiedBadge';
import { X, Lock, Trophy, Award, CheckCircle2 } from 'lucide-react';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel?: number;
  earnedBadgeIds?: string[];
}

export function BadgesModal({
  isOpen,
  onClose,
  userLevel = 1,
  earnedBadgeIds = []
}: BadgesModalProps) {
  if (!isOpen) return null;

  const unlockedCount = BADGES.filter(b => b.reqLevel <= userLevel || earnedBadgeIds.includes(b.id)).length;
  const progressPercent = Math.round((unlockedCount / 100) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        {/* Click outside backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-white font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">100 Level Arena Badges</h2>
                <VerifiedBadge level={userLevel} size="md" showLevelNumber={true} />
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Earn 20 XP at noob levels to unlock verified badges. Higher levels require elite focus!
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="my-4 bg-neutral-900 p-3 rounded-2xl border border-neutral-800/80 font-mono text-xs flex flex-col gap-2">
            <div className="flex justify-between items-center font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                <Award className="w-4 h-4" />
                COLLECTION PROGRESS: {unlockedCount} / 100 UNLOCKED
              </span>
              <span className="text-amber-300 font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 h-full transition-all duration-500 shadow-md"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 100 Badges Grid Container */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = badge.reqLevel <= userLevel || earnedBadgeIds.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 group cursor-pointer ${
                      isUnlocked
                        ? 'bg-neutral-900/90 border-emerald-500/40 hover:border-emerald-400 hover:scale-105 shadow-lg'
                        : 'bg-neutral-950/60 border-neutral-900 opacity-40 hover:opacity-70'
                    }`}
                  >
                    {/* Badge Icon Shape */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md relative ${
                        isUnlocked ? `bg-gradient-to-br ${badge.color}` : 'bg-neutral-800 text-neutral-600'
                      }`}
                    >
                      {isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                      ) : (
                        <Lock className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>

                    <span className="text-[9px] font-mono font-bold text-center mt-2 truncate w-full text-neutral-200">
                      {badge.name}
                    </span>

                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded mt-1 ${
                      isUnlocked ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40' : 'text-neutral-500 bg-neutral-900'
                    }`}>
                      Lv.{badge.reqLevel}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-44 bg-neutral-900 border border-neutral-700 p-2 rounded-xl shadow-2xl text-[9px] font-mono pointer-events-none text-left">
                      <p className="font-bold text-emerald-400 uppercase">{badge.name}</p>
                      <p className="text-neutral-400 text-[8px] mt-0.5">{badge.description}</p>
                      <p className="text-[8px] font-bold text-amber-300 mt-1">
                        {isUnlocked ? '✓ UNLOCKED' : `🔒 Requires Level ${badge.reqLevel}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer close button */}
          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Done Viewing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default BadgesModal;
