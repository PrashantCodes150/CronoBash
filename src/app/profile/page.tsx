"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  
  const [lifetimeSeconds, setLifetimeSeconds] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [globalRank, setGlobalRank] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch statistics from Supabase
  const loadProfileStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch all study sessions to calculate lifetime totals
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (!error && sessions) {
        let secSum = 0;
        sessions.forEach(s => {
          secSum += s.focus_seconds || 0;
        });
        setLifetimeSeconds(secSum);
        setTotalSessions(sessions.length);
      }

      // 2. Build leaderboard: fetch all users, then calculate focus hours via RPC or session aggregation
      //    Query study_sessions grouped by user_id to get total focus per user
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('user_id, focus_seconds, start_time');

      const focusByUser: Record<string, number> = {};
      if (allSessions) {
        for (const s of allSessions) {
          focusByUser[s.user_id] = (focusByUser[s.user_id] || 0) + (s.focus_seconds || 0);
        }
      }

      // Fetch user profiles for top focus users
      const userIds = Object.keys(focusByUser).slice(0, 10);
      if (userIds.length > 0) {
        const { data: usersList } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (usersList) {
          const enriched = usersList.map(u => ({
            ...u,
            hours: Math.round((focusByUser[u.id] || 0) / 3600 * 10) / 10
          })).sort((a, b) => b.hours - a.hours);
          setLeaderboard(enriched);

          // Calculate global rank: how many users have more focus than current user
          const myFocus = focusByUser[user.id] || 0;
          const rank = Object.values(focusByUser).filter(h => h > myFocus).length + 1;
          setGlobalRank(rank);
        }
      }

      // 3. Calculate streak from session history
      if (allSessions) {
        const sessionDates = new Set<string>();
        for (const s of allSessions) {
          sessionDates.add(new Date(s.start_time).toISOString().split('T')[0]);
        }

        let streak = 0;
        const checkDate = new Date();
        if (!sessionDates.has(checkDate.toISOString().split('T')[0])) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        while (sessionDates.has(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        setStreakDays(streak);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfileStats();
    }
  }, [user]);

  // Derive achievements from real data (computed after lifetimeHours)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">PULLING CONTESTANT PROFILE...</p>
      </div>
    );
  }

  const lifetimeHours = (lifetimeSeconds / 3600).toFixed(1);

  const achievements = [
    { id: '1', title: 'Focus Initiate', desc: 'Log your first study session in solo mode.', icon: 'military_tech', unlocked: totalSessions > 0 },
    { id: '2', title: 'Stakes Champion', desc: 'Participate and win in any money room contest.', icon: 'award_star', unlocked: lifetimeSeconds >= 3600 },
    { id: '3', title: 'Flow State Master', desc: 'Maintain an average of 95% focus score.', icon: 'bolt', unlocked: lifetimeSeconds >= 18000 },
    { id: '4', title: 'Consecutive Grind', desc: 'Reach a study streak of 10 days.', icon: 'local_fire_department', unlocked: streakDays >= 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Contestant Rig Profile</h2>
        <p className="text-xs text-on-surface-variant mt-1">Trace lifetime focus hours, active ranks, and unlocked achievements</p>
      </header>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): User card, Achievements & Standings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* User profile stats card */}
          <div className="card-base p-6 md:p-8 relative overflow-hidden group border-l-2 border-primary-fixed bg-grid-pattern">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-container bg-surface-variant shrink-0">
                <img 
                  alt="User avatar" 
                  className="w-full h-full object-cover" 
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} 
                />
              </div>
              <div className="space-y-1 select-none text-center sm:text-left">
                <h3 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">
                  {profile?.name || 'Arena Fighter'}
                </h3>
                <p className="font-label-mono text-xs text-on-surface-variant">{profile?.email}</p>
                <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                  <span className="font-label-mono text-[9px] font-bold bg-primary-container/15 text-primary-fixed px-2 py-0.5 rounded border border-primary-container/30">
                    Rank: #{globalRank} Global
                  </span>
                  <span className="font-label-mono text-[9px] font-bold bg-secondary-container/15 text-secondary-fixed px-2 py-0.5 rounded border border-secondary-container/30">
                    Tier: {lifetimeSeconds >= 36000 ? 'Elite Cadet' : lifetimeSeconds >= 18000 ? 'Sprint Veteran' : lifetimeSeconds >= 3600 ? 'Focus Initiate' : 'Rookie'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/30 mt-6 pt-6 text-center">
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Lifetime Hours</p>
                <p className="font-display text-2xl font-black text-on-surface mt-1">{lifetimeHours}h</p>
              </div>
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Total Sprints</p>
                <p className="font-display text-2xl font-black text-on-surface mt-1">{totalSessions}</p>
              </div>
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Streaks</p>
                <p className="font-display text-2xl font-black text-primary-fixed mt-1">{streakDays} Days</p>
              </div>
            </div>
          </div>

          {/* Achievements list */}
          <section className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Achievements & Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    ach.unlocked 
                      ? 'bg-surface-container-low border-outline-variant/60 hover:border-primary-fixed-dim' 
                      : 'bg-surface-container-low/20 border-outline-variant/20 opacity-40'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                    ach.unlocked ? 'bg-primary-container/10 text-primary-fixed' : 'bg-surface-variant text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined text-xl">{ach.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold text-on-surface uppercase tracking-tight">{ach.title}</h4>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Standings / Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Global standings */}
          <div className="glass-panel rounded-xl p-6 space-y-6 border-t-2 border-t-secondary-fixed">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Global Standings</h3>
            
            <div className="space-y-3 font-mono text-xs">
              {leaderboard.map((u, index) => {
                const isCurrentUser = u.id === user?.id;
                return (
                  <div 
                    key={u.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCurrentUser 
                        ? 'bg-primary-container/10 border-primary-fixed text-primary-fixed font-bold' 
                        : 'bg-surface-container-high/40 border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xs font-extrabold">{index + 1}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                        <img alt={u.name} className="w-full h-full object-cover" src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} />
                      </div>
                      <span className="truncate max-w-[120px]">{u.name}</span>
                    </div>
                    <span>{u.hours} hrs</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
