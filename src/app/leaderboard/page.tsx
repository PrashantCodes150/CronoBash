"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LeaderboardRow } from '@/components/study/LeaderboardRow';
import { LeaderboardFilters } from '@/components/study/LeaderboardFilters';
import { Trophy, HelpCircle, ArrowUpCircle } from 'lucide-react';

interface LeaderboardUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_focus_hours: number;
  avg_focus_percent: number;
  win_rate: number;
  verified_badge: boolean;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('alltime');
  const [roomType, setRoomType] = useState('all');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        // Query paginated users sorted by focus hours
        const { data, error } = await supabase
          .from('leaderboard_cache')
          .select('*')
          .order('total_focus_hours', { ascending: false })
          .limit(50);

        if (error) throw error;
        setUsers(data || []);

        // Load active user profile and find their relative rank
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: selfStats, error: selfErr } = await supabase
            .from('leaderboard_cache')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!selfErr && selfStats) {
            // Find how many users have more hours to compute exact rank index
            const { count } = await supabase
              .from('leaderboard_cache')
              .select('*', { count: 'exact', head: true })
              .gt('total_focus_hours', selfStats.total_focus_hours);

            setCurrentUserRank((count || 0) + 1);
          }
        }
      } catch (err) {
        console.error("Leaderboard loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [timeRange, roomType, skillLevel]);

  // Is current user in the top 50 array
  const isSelfInTop50 = currentUser && users.some(u => u.user_id === currentUser.id);
  const selfUserData = users.find(u => u.user_id === currentUser?.id);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      
      {/* Header title */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <div className="bg-orange-500/10 p-2.5 rounded border border-orange-500/30 text-orange-500">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wider uppercase font-mono">Global Leaderboards</h1>
          <p className="text-[10px] text-neutral-500 font-mono">Compare your focus efficiency and total hours with the world</p>
        </div>
      </div>

      {/* Filter component */}
      <LeaderboardFilters
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        roomType={roomType}
        setRoomType={setRoomType}
        skillLevel={skillLevel}
        setSkillLevel={setSkillLevel}
      />

      {/* Sticky current user standings if not in top 50 */}
      {currentUser && !isSelfInTop50 && currentUserRank && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-mono text-neutral-300">
              You are currently ranked <strong className="text-orange-500">#{currentUserRank}</strong> out of all arena fighters!
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded">
            Keep studying to hit top 50!
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-neutral-500 font-mono">Querying top standings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="p-3">Rank</th>
                  <th className="p-3">User Profile</th>
                  <th className="p-3">Focus Hours</th>
                  <th className="p-3">Avg Focus Ratio</th>
                  <th className="p-3">Arena Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <LeaderboardRow
                    key={u.user_id}
                    rank={idx + 1}
                    user={u}
                    isCurrentUser={currentUser && u.user_id === currentUser.id}
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-neutral-500 italic font-mono">No players listed in this tier yet. Be the first!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
