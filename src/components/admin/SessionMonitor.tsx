"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, RefreshCw, Flag, XCircle, Search } from 'lucide-react';
import { SessionDetailModal } from './SessionDetailModal';

interface ActiveSession {
  id: string;
  room_id: string;
  user_id: string;
  focus_score: number;
  focus_seconds: number;
  is_active: boolean;
  is_muted: boolean;
  hands_down: boolean;
  attention_ratio: number;
  interruptions_count: number;
  userName?: string;
  roomName?: string;
}

export function SessionMonitor() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [filterFakeCam, setFilterFakeCam] = useState('all');
  const [filterRoomType, setFilterRoomType] = useState('all');

  useEffect(() => {
    async function loadActiveSessions() {
      try {
        const { data: presence, error } = await supabase
          .from('room_presence')
          .select('*, users(name), rooms(name, type)')
          .eq('is_active', true);

        if (error) throw error;

        const formatted: ActiveSession[] = (presence || []).map((p: any) => ({
          id: p.id,
          room_id: p.room_id,
          user_id: p.user_id,
          focus_score: p.focus_score,
          focus_seconds: p.focus_seconds,
          is_active: p.is_active,
          is_muted: p.is_muted,
          hands_down: p.hands_down,
          attention_ratio: p.attention_ratio,
          interruptions_count: p.interruptions_count,
          userName: p.users?.name || 'Unknown User',
          roomName: p.rooms?.name || 'Unknown Room',
          roomType: p.rooms?.type || 'public'
        }));

        setSessions(formatted);
      } catch (err) {
        console.error("Error loading active sessions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadActiveSessions();

    const channel = supabase
      .channel('admin_presence_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_presence' },
        () => {
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleResetSession = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', roomId);
      if (error) throw error;
      alert("Session force-closed successfully.");
    } catch (err) {
      console.error("Force end session error:", err);
    }
  };

  const handleFlagUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.from('reports').insert({
        user_id: userId,
        reason: "Administrative Review Flag",
        details: { flagged_by: "system_admin" }
      });
      if (error) throw error;
      alert(`User ${userName} has been flagged for audit review.`);
    } catch (err) {
      console.error("Flag user error:", err);
    }
  };

  const filtered = sessions.filter((s: any) => {
    const isCheat = s.attention_ratio < 20 || s.interruptions_count > 4;
    if (filterFakeCam === 'yes' && !isCheat) return false;
    if (filterFakeCam === 'no' && isCheat) return false;
    if (filterRoomType !== 'all' && s.roomType !== filterRoomType) return false;
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Session List Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold font-mono text-orange-500 uppercase tracking-wide">Live Active Sessions ({filtered.length})</h2>
          
          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={filterFakeCam}
              onChange={(e) => setFilterFakeCam(e.target.value)}
              className="bg-black border border-neutral-800 rounded text-[11px] font-mono p-1.5 text-neutral-350"
            >
              <option value="all">All Telemetry</option>
              <option value="yes">Flagged Cheat Risk</option>
              <option value="no">Normal Focus</option>
            </select>

            <select 
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
              className="bg-black border border-neutral-800 rounded text-[11px] font-mono p-1.5 text-neutral-350"
            >
              <option value="all">All Rooms</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="money">Money</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-xs py-8 text-neutral-500 font-mono">Connecting session scanner...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="p-3">User</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Focus Score</th>
                  <th className="p-3">Attention</th>
                  <th className="p-3">Warnings</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const isCheatRisk = s.attention_ratio < 20 || s.interruptions_count > 4;
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => setSelectedSession(s)}
                      className={`border-b border-neutral-850 hover:bg-neutral-850/30 transition cursor-pointer ${selectedSession?.id === s.id ? 'bg-neutral-800/40' : ''}`}
                    >
                      <td className="p-3 font-semibold text-white">{s.userName}</td>
                      <td className="p-3 text-neutral-450">{s.roomName}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{s.focus_score} pts</td>
                      <td className="p-3 font-mono text-neutral-300">{s.attention_ratio}%</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isCheatRisk ? 'bg-red-950/80 text-red-400 border border-red-900/50' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'}`}>
                          {isCheatRisk ? 'Cheat risk' : 'Healthy'}
                        </span>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleFlagUser(s.user_id, s.userName || '')}
                            title="Flag User Profile"
                            className="p-1.5 rounded bg-neutral-800 hover:bg-orange-950/50 border border-neutral-700 hover:border-orange-900/50 text-orange-400 transition"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleResetSession(s.room_id)}
                            title="Force End Session"
                            className="p-1.5 rounded bg-neutral-800 hover:bg-red-950/50 border border-neutral-700 hover:border-red-900/50 text-red-400 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-500 italic font-mono">No active room sessions match filter criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Session Audit Detail Modal */}
      <SessionDetailModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
      />
    </div>
  );
}
