"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Award, Smile, RefreshCw, Frown, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface RoomStatsSidebarProps {
  roomId: string;
  userId: string;
  focusScore: number;
  distractions: number;
  activeDistraction: string | null;
  isFakeCam: boolean;
  distractionCounts: {
    'hand-down': number;
    'gaze-away': number;
    'eye-closed': number;
    'face-absent': number;
    'static-frame': number;
  };
  opponentScores: { id: string; name: string; score: number }[];
  timeRemainingSeconds: number;
}

export function RoomStatsSidebar({
  roomId,
  userId,
  focusScore,
  distractions,
  activeDistraction,
  isFakeCam,
  distractionCounts,
  opponentScores,
  timeRemainingSeconds
}: RoomStatsSidebarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedUser, setReportedUser] = useState('');
  const [reportReason, setReportReason] = useState('');

  // Format timer countdown
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendEmote = (emote: string) => {
    supabase.channel(`room_${roomId}_signaling`).send({
      type: 'broadcast',
      event: 'quick_emote',
      payload: { from: userId, emote }
    });
  };

  const submitReport = async () => {
    if (!reportedUser || !reportReason) return;
    try {
      const { error } = await supabase.from('reports').insert({
        user_id: reportedUser,
        reported_by: userId,
        reason: reportReason,
        details: { room_id: roomId }
      });
      if (error) throw error;
      alert("Player reported. The system will review their telemetry stream.");
      setShowReportModal(false);
      setReportReason('');
      setReportedUser('');
    } catch (err) {
      console.error("Report submit error:", err);
    }
  };

  return (
    <div className="w-full lg:w-[320px] bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col p-4 text-white justify-between h-auto lg:h-full select-none">
      {/* Top Section */}
      <div className="flex flex-row lg:flex-col justify-between lg:justify-start gap-4 items-center lg:items-stretch">
        
        {/* Countdown */}
        <div className="flex flex-col items-center justify-center bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex-1 lg:flex-none">
          <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">Time Remaining</span>
          <span className="text-xl lg:text-3xl font-extrabold text-orange-500 font-mono">
            {formatTime(timeRemainingSeconds)}
          </span>
        </div>

        {/* Live Focus Score Badge */}
        <div 
          className="relative bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex-1 lg:flex-none flex flex-col items-center justify-center cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-neutral-500 font-mono uppercase">Live Focus Score</span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {focusScore}
          </span>
          <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
            {distractions} distraction{distractions !== 1 ? 's' : ''}
          </span>

          {/* Hover distraction details tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-black/95 text-[11px] p-2.5 rounded border border-neutral-800 z-50 pointer-events-none font-mono"
              >
                <div className="text-neutral-400 border-b border-neutral-800 pb-1 mb-1 font-bold">Distraction Logs</div>
                <div className="flex justify-between"><span>👋 Hands:</span> <span className="text-red-400">{distractionCounts['hand-down']}</span></div>
                <div className="flex justify-between"><span>👀 Gaze Away:</span> <span className="text-red-400">{distractionCounts['gaze-away']}</span></div>
                <div className="flex justify-between"><span>😴 Eyes Closed:</span> <span className="text-red-400">{distractionCounts['eye-closed']}</span></div>
                <div className="flex justify-between"><span>👤 Face Absent:</span> <span className="text-red-400">{distractionCounts['face-absent']}</span></div>
                <div className="flex justify-between"><span>📺 Static Frame:</span> <span className="text-red-400">{distractionCounts['static-frame']}</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Middle Section: Leaderboard / Opponents */}
      <div className="my-4 flex-grow overflow-auto max-h-[160px] lg:max-h-none border-t border-b border-neutral-850 py-3 hidden md:flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Live Standings</span>
        </div>
        <div className="space-y-2 flex-grow overflow-y-auto">
          {opponentScores.map((opp, idx) => (
            <div key={opp.id} className="flex justify-between items-center bg-neutral-950/40 p-2 rounded border border-neutral-850 text-xs">
              <span className="text-neutral-400 truncate max-w-[150px]">{opp.name}</span>
              <span className="font-mono font-bold text-emerald-400">{opp.score} pts</span>
            </div>
          ))}
          {opponentScores.length === 0 && (
            <span className="text-[11px] text-neutral-500 italic block text-center mt-3">Waiting for opponents...</span>
          )}
        </div>
      </div>

      {/* Bottom Section: Emote dock & Actions */}
      <div className="flex flex-row lg:flex-col gap-2 items-center lg:items-stretch">
        {/* Emotes dock */}
        <div className="flex justify-around bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex-grow lg:flex-none">
          <button onClick={() => handleSendEmote('👍')} className="hover:scale-125 transition text-lg">👍</button>
          <button onClick={() => handleSendEmote('🔥')} className="hover:scale-125 transition text-lg">🔥</button>
          <button onClick={() => handleSendEmote('😴')} className="hover:scale-125 transition text-lg">😴</button>
          <button onClick={() => handleSendEmote('👏')} className="hover:scale-125 transition text-lg">👏</button>
        </div>

        {/* Report button */}
        <button 
          onClick={() => setShowReportModal(true)}
          className="flex items-center justify-center gap-1 text-[11px] text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 rounded-lg p-2 transition font-mono uppercase tracking-wider"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Report Player</span>
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-extrabold text-orange-500 uppercase font-mono mb-3">Report Player Telemetry</h3>
            
            <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Select Competitor</label>
            <select 
              value={reportedUser}
              onChange={(e) => setReportedUser(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-white mb-3"
            >
              <option value="">-- Choose User --</option>
              {opponentScores.map(opp => (
                <option key={opp.id} value={opp.id}>{opp.name}</option>
              ))}
            </select>

            <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Reason</label>
            <select 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-white mb-4"
            >
              <option value="">-- Reason --</option>
              <option value="Fake Camera Frame / Photo Loop">Fake Camera Frame / Photo Loop</option>
              <option value="Away from Desk / Absent">Away from Desk / Absent</option>
              <option value="Phone usage / Distracted">Phone usage / Distracted</option>
              <option value="Abusive chat message">Abusive chat message</option>
            </select>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowReportModal(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs px-3 py-1.5 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={submitReport}
                className="bg-red-650 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-bold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
