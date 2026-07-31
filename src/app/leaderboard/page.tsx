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
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto rounded-[32px] font-sans">
      
      {/* Header title */}
      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#334155] tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Global <span style={{ color: '#ff5500' }}>Leaderboards</span>
          </h1>
          <p className="text-sm text-[#44474c] mt-0.5">Compare your focus efficiency and total study hours with the world</p>
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
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-surface-container border border-amber-500/40 p-4 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-amber-400 animate-bounce" />
            <span className="text-xs font-mono text-white">
              You are currently ranked <strong className="text-amber-400 font-bold">#{currentUserRank}</strong> out of all arena fighters!
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            Keep studying to hit top 50!
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-md overflow-hidden text-[#1c1917]">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-semibold">Querying top standings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#75777d] uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-3">Rank</th>
                  <th className="p-3">User Profile</th>
                  <th className="p-3 hidden sm:table-cell">Focus Hours</th>
                  <th className="p-3 hidden md:table-cell">Avg Focus Ratio</th>
                  <th className="p-3 hidden lg:table-cell">Arena Win Rate</th>
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
