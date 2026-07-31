"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES } from '@/lib/badges';
import { BadgeDisplay } from './BadgeDisplay';
import { X, Trophy, Award } from 'lucide-react';

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
        {/* Click outside backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white border border-white/80 rounded-[32px] p-6 md:p-8 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#F59E0B]" />
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">100 Level Arena Emblem Badges</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Complete focus sprints to level up and unlock all 100 custom vector emblem medals!
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="my-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs flex flex-col gap-2">
            <div className="flex justify-between items-center font-extrabold">
              <span className="text-[#10B981] flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                COLLECTION PROGRESS: {unlockedCount} / 100 UNLOCKED
              </span>
              <span className="text-[#3B82F6] font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#10B981] via-[#3B82F6] to-[#F59E0B] h-full transition-all duration-500 rounded-full shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 100 Badges Grid Container */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {BADGES.map((badge) => {
                const isUnlocked = badge.reqLevel <= userLevel || earnedBadgeIds.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all duration-300 group cursor-pointer text-center ${
                      isUnlocked
                        ? 'bg-white border-slate-200 hover:border-[#3B82F6] hover:scale-105 shadow-sm'
                        : 'bg-slate-50 border-slate-100 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <BadgeDisplay badge={badge} isUnlocked={isUnlocked} size="md" />

                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs font-black text-slate-900 line-clamp-1">{badge.name}</p>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                        isUnlocked ? 'bg-emerald-50 text-[#10B981]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        Level {badge.reqLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
