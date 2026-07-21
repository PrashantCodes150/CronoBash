"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Award, Trophy, Users, Clock } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  totalFocusHours: number;
  rank: number;
}

export default function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch top focus hours from user statistics or profiles
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .limit(10); // Simulating top 10 focus hours

        if (!error && data) {
          const list = data.map((u: any, idx) => ({
            userId: u.id,
            name: u.name,
            avatarUrl: u.avatar_url,
            totalFocusHours: 120 - (idx * 8), // Simulated top hours descending
            rank: idx + 1
          }));
          setEntries(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg w-full max-w-2xl">
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          Global Focus Legends
        </h3>
        <span className="text-[10px] text-neutral-500 font-mono">ALL-TIME FOCUS HOURS</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs font-mono text-neutral-500">
          COMPILING LEADERBOARDS...
        </div>
      ) : (
        <div className="divide-y divide-neutral-950">
          {entries.map((player) => (
            <div key={player.userId} className="px-6 py-3 flex items-center justify-between hover:bg-neutral-850/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-black text-sm ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-neutral-300' : player.rank === 3 ? 'text-amber-700' : 'text-neutral-500'}`}>
                  #{player.rank}
                </span>
                
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-full border border-neutral-800 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {player.name.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <span className="font-medium text-white block text-sm">{player.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{player.totalFocusHours} hrs focused</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
