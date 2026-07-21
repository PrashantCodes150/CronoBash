"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Award, Compass, Eye, ShieldCheck } from 'lucide-react';

interface SessionDetailModalProps {
  session: {
    id: string;
    room_id: string;
    user_id: string;
    focus_score: number;
    focus_seconds: number;
    is_active: boolean;
    hands_down: boolean;
    attention_ratio: number;
    interruptions_count: number;
    userName?: string;
    roomName?: string;
  } | null;
  onClose: () => void;
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  if (!session) return null;

  const isCheatRisk = session.attention_ratio < 20 || session.interruptions_count > 4;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Session Audit Trace</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-450 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${isCheatRisk ? 'bg-red-950/30 border-red-900/50 text-red-300' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'}`}>
            {isCheatRisk ? (
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-mono leading-relaxed">
              <strong className="block mb-1 text-[11px] uppercase tracking-wide">
                {isCheatRisk ? 'Cheat Behavior Flagged' : 'Audit Status: Healthy'}
              </strong>
              {isCheatRisk 
                ? 'Telemetry coordinates show low screen look ratios or frozen video loop signatures. Administrative flag recommended.'
                : 'Session is operating within normal variance parameters. Micro-movements verified.'}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg flex flex-col font-mono text-[10px]">
              <span className="text-neutral-500 uppercase">Focus Score</span>
              <span className="text-xl font-bold text-emerald-400 mt-1">{session.focus_score} pts</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg flex flex-col font-mono text-[10px]">
              <span className="text-neutral-500 uppercase">Attention Ratio</span>
              <span className="text-xl font-bold text-white mt-1">{session.attention_ratio}%</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg flex flex-col font-mono text-[10px]">
              <span className="text-neutral-500 uppercase">Focus Time</span>
              <span className="text-xl font-bold text-white mt-1">{(session.focus_seconds / 60).toFixed(1)} m</span>
            </div>
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg flex flex-col font-mono text-[10px]">
              <span className="text-neutral-500 uppercase">Warnings logged</span>
              <span className="text-xl font-bold text-red-500 mt-1">{session.interruptions_count}</span>
            </div>
          </div>

          {/* User Details */}
          <div className="border-t border-neutral-850 pt-4 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-neutral-500">Participant:</span> <span className="text-white font-bold">{session.userName}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Participant ID:</span> <span className="text-neutral-450 truncate max-w-[200px]">{session.user_id}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Target Room:</span> <span className="text-white">{session.roomName}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Postural Forfeit:</span> <span className="text-white">{session.hands_down ? 'Forfeited' : 'Normal'}</span></div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-950/40 border-t border-neutral-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-white rounded-lg text-xs font-mono border border-neutral-800 transition"
          >
            Close Feed Detail
          </button>
        </div>
      </motion.div>
    </div>
  );
}
