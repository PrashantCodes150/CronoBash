"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Task, Room } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { VerifiedBadge } from '@/components/study/VerifiedBadge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TaskWidget } from '@/components/widgets/TaskWidget';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { TimeTrackerWidget } from '@/components/widgets/TimeTrackerWidget';
import { NoteWidget } from '@/components/widgets/NoteWidget';
import { MoneyMatchWidget } from '@/components/widgets/MoneyMatchWidget';
import { ReferralCard } from '@/components/study/ReferralCard';
import { StudentAdBanner } from '@/components/ads/StudentAdBanner';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, wallet, refreshWallet } = useAuth();

  // Metrics states
  const [focusSecondsToday, setFocusSecondsToday] = useState(0);
  const [totalSecondsToday, setTotalSecondsToday] = useState(0);
  const [totalSessionsToday, setTotalSessionsToday] = useState(0);
  const [avgFocusPercent, setAvgFocusPercent] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [targetGoal, setTargetGoal] = useState(120); // Default daily goal minutes

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Engineering');

  // Rooms state
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [allSessionsList, setAllSessionsList] = useState<any[]>([]);
  const [taskFocusMinutes, setTaskFocusMinutes] = useState<Record<string, number>>({});
  const [roomFocusMinutes, setRoomFocusMinutes] = useState<Record<string, number>>({});

  // Charts states
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [hourlyChartData, setHourlyChartData] = useState<any[]>([]);

  // Challenge Squad Member Modal states
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeOpponent, setChallengeOpponent] = useState('');
  const [selectedOpponentUser, setSelectedOpponentUser] = useState<any | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [challengeDuration, setChallengeDuration] = useState(25);
  const [challengeStake, setChallengeStake] = useState(0);
  const [challengeTitle, setChallengeTitle] = useState('1v1 Focus Sprint');
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  // Real-time registered user search
  useEffect(() => {
    if (!challengeOpponent.trim() || challengeOpponent.length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .or(`name.ilike.%${challengeOpponent.trim()}%,email.ilike.%${challengeOpponent.trim()}%`)
          .neq('id', user?.id || '')
          .limit(5);

        if (!error && data) {
          setUserSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [challengeOpponent, user?.id]);

  // Persistent Deleted Sessions Register (ensures deleted sessions NEVER reappear on refresh)
  const getDeletedSessionIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('cronobash_deleted_session_ids');
      if (!raw) return new Set();
      return new Set(JSON.parse(raw));
    } catch {
      return new Set();
    }
  };

  const addDeletedSessionId = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const current = getDeletedSessionIds();
      current.add(String(id));
      localStorage.setItem('cronobash_deleted_session_ids', JSON.stringify(Array.from(current)));
    } catch (e) {}
  };

  // Delete Study Session Handler
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sessionId) return;

    // 1. Register ID in persistent deleted sessions set
    addDeletedSessionId(String(sessionId));

    // 2. Remove from UI state immediately
    setAllSessionsList(prev => prev.filter(s => String(s.id) !== String(sessionId)));

    // 3. Delete from Supabase study_sessions table
    try {
      await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId);
    } catch (err) {
      console.error('Supabase session delete error:', err);
    }

    // 4. Clear from local storage caches if stored locally
    if (typeof window !== 'undefined') {
      const storageKeys = ['cronobash_productivity_sessions', 'cronobash_study_sessions', 'study_sessions_cache'];
      storageKeys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updated = list.filter((s: any) => String(s.id) !== String(sessionId) && String(s.session_id) !== String(sessionId));
              localStorage.setItem(key, JSON.stringify(updated));
            }
          } catch (err) {}
        }
      });
    }

    toast.success('Study session deleted permanently! 🗑️');
  };

  // Launch Squad Challenge Handler
  const handleSendSquadChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreatingChallenge(true);
    try {
      const { data: profileCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileCheck) {
        await supabase.from('users').insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Contestant',
          email: user.email || '',
          daily_goal_minutes: 120
        });
      }

      const roomName = challengeTitle.trim() || '1v1 Squad Battle';
      const isMoneyRoom = challengeStake > 0;
      const opponentDisplayName = selectedOpponentUser?.name || challengeOpponent.trim() || 'Squad Member';

      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          type: isMoneyRoom ? 'money' : 'private',
          owner_id: user.id,
          max_members: 2,
          entry_fee: challengeStake,
          platform_fee_percent: 10,
          subject_tags: ['Squad Challenge', `${challengeDuration}m`],
          description: `1v1 Duel Challenge vs ${opponentDisplayName} (${challengeDuration} mins)`,
          is_active: true
        })
        .select()
        .single();

      if (roomError || !newRoom) {
        toast.error(roomError?.message || 'Failed to create challenge room.');
        setCreatingChallenge(false);
        return;
      }

      await supabase.from('room_members').insert({
        room_id: newRoom.id,
        user_id: user.id,
        total_focus_seconds_today: 0
      });

      // Dispatch invite notification if an opponent user was selected/searched
      if (selectedOpponentUser?.id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedOpponentUser.id,
            title: '⚔️ SQUAD BATTLE CHALLENGE!',
            message: `${user.user_metadata?.name || user.email?.split('@')[0] || 'A squad member'} challenged you to a ${challengeDuration}m 1v1 Focus Duel: "${roomName}"!`,
            type: 'invite',
            is_read: false,
            metadata: {
              room_id: newRoom.id,
              invite_code: newRoom.invite_code || '',
              challenger_id: user.id,
              challenger_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Challenger'
            }
          });

        if (!notifError) {
          toast.success(`Invite notification sent to ${selectedOpponentUser.name || 'squad member'}! 🚀`);
        }
      } else {
        toast.success(`Challenge Room Created! Launching Battle Lobby... ⚔️`);
      }

      setIsChallengeModalOpen(false);
      router.push(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Error initiating squad challenge.');
    } finally {
      setCreatingChallenge(false);
    }
  };

  // Fetch Dashboard metrics from Supabase
  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // ── Timezone-safe date helpers ──
      // Build local midnight boundaries as UTC ISO strings so queries
      // correctly match sessions created anywhere in the world.
      const localToday = new Date();
      const localMidnightStart = new Date(
        localToday.getFullYear(), localToday.getMonth(), localToday.getDate(), 0, 0, 0, 0
      ).toISOString();
      const localMidnightEnd = new Date(
        localToday.getFullYear(), localToday.getMonth(), localToday.getDate(), 23, 59, 59, 999
      ).toISOString();

      let focusSum = 0;
      let totalSum = 0;

      // 1. Fetch study sessions today (using local-day boundaries)
      const { data: sessionsToday, error: sessError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', localMidnightStart)
        .lte('start_time', localMidnightEnd);

      if (!sessError && sessionsToday) {
        sessionsToday.forEach(s => {
          focusSum += s.focus_seconds || 0;
          totalSum += s.total_seconds || 0;
        });
        setFocusSecondsToday(focusSum);
        setTotalSecondsToday(totalSum);
        setTotalSessionsToday(sessionsToday.length);
        if (totalSum > 0) {
          setAvgFocusPercent(Math.round((focusSum / totalSum) * 100));
        }
      }

      // 2. Fetch User Profile for daily targets
      const { data: profData } = await supabase
        .from('users')
        .select('daily_goal_minutes')
        .eq('id', user.id)
        .single();
      if (profData) {
        setTargetGoal(profData.daily_goal_minutes || 120);
      }

      // 3. Fetch Tasks
      const { data: tasksList } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('completed', { ascending: true });
      if (tasksList) setTasks(tasksList as Task[]);

      // 4. Fetch Lobbies user has joined
      const { data: lobbiesJoined } = await supabase
        .from('room_members')
        .select('rooms(*)')
        .eq('user_id', user.id);
      
      if (lobbiesJoined) {
        const parsed: Room[] = lobbiesJoined
          .map((l: any) => l.rooms)
          .filter((r: any) => r !== null && r.is_active);
        setLiveRooms(parsed);
      }

      // 5. Chart 1: Weekly Focus (Last 7 local days)
      const sevenDaysAgoLocal = new Date(
        localToday.getFullYear(), localToday.getMonth(), localToday.getDate() - 6, 0, 0, 0, 0
      ).toISOString();

      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('start_time, focus_seconds')
        .eq('user_id', user.id)
        .gte('start_time', sevenDaysAgoLocal)
        .lte('start_time', localMidnightEnd);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyMinutes: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyMinutes[dayNames[d.getDay()]] = 0;
      }

      if (weekSessions) {
        for (const s of weekSessions) {
          const d = new Date(s.start_time);
          // Use LOCAL day-of-week so IST sessions map to correct bar
          const key = dayNames[d.getDay()];
          if (key in dailyMinutes) {
            dailyMinutes[key] += Math.round((s.focus_seconds || 0) / 60);
          }
        }
      }

      setWeeklyChartData(
        Object.entries(dailyMinutes).map(([day, minutes]) => ({ day, minutes }))
      );

      // 6. Chart 2: Hourly Focus (Today) — bucket by 2-hour windows
      const hourlyBuckets: Record<string, number> = {};
      for (let h = 0; h <= 22; h += 2) {
        const label = `${String(h).padStart(2, '0')}:00`;
        hourlyBuckets[label] = 0;
      }

      if (sessionsToday) {
        for (const s of sessionsToday) {
          const d = new Date(s.start_time);
          // Use local hours so IST sessions land in the correct bucket
          const h = d.getHours();
          const bucket = Math.floor(h / 2) * 2;
          const label = `${String(bucket).padStart(2, '0')}:00`;
          if (label in hourlyBuckets) {
            hourlyBuckets[label] += Math.round((s.focus_seconds || 0) / 60);
          }
        }
      }

      setHourlyChartData(
        Object.entries(hourlyBuckets).map(([name, minutes]) => ({ name, minutes }))
      );

      // 7. Fetch all study sessions to populate logs, task aggregations, and room aggregations
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('*, rooms(type)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (allSessions) {
        const deletedIds = getDeletedSessionIds();
        const activeSessions = allSessions.filter((s: any) => !deletedIds.has(String(s.id)));
        setAllSessionsList(activeSessions);

        // Aggregate room focus minutes
        const roomMinutes: Record<string, number> = {};
        // Aggregate task focus minutes
        const taskMinutes: Record<string, number> = {};

        activeSessions.forEach((s: any) => {
          // Room aggregation
          if (s.room_id) {
            roomMinutes[s.room_id] = (roomMinutes[s.room_id] || 0) + Math.round((s.focus_seconds || 0) / 60);
          }

          // Task aggregation - match by name (since the session name matches the task title)
          if (s.name) {
            const taskKey = s.name.trim().toLowerCase();
            taskMinutes[taskKey] = (taskMinutes[taskKey] || 0) + Math.round((s.focus_seconds || 0) / 60);
          }
        });

        setRoomFocusMinutes(roomMinutes);
        setTaskFocusMinutes(taskMinutes);

        // Convert each session start_time to a local YYYY-MM-DD string
        const toLocalDateStr = (iso: string) => {
          const d = new Date(iso);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        const todayLocalStr = toLocalDateStr(new Date().toISOString());

        const sessionDates = new Set<string>();
        for (const s of allSessions) {
          sessionDates.add(toLocalDateStr(s.start_time));
        }

        let streak = 0;
        const checkDate = new Date();
        if (!sessionDates.has(todayLocalStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (sessionDates.has(toLocalDateStr(checkDate.toISOString()))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        setStreakDays(streak);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  // CRUD Tasks handlers
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          subject: newTaskSubject,
          planned_minutes: 45,
          completed: false
        })
        .select()
        .single();

      if (!error && data) {
        setTasks([...tasks, data as Task]);
        setNewTaskTitle('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentCompleted })
        .eq('id', id);

      if (!error) {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
      refreshWallet();
    }
  }, [user]);

  if (loadingData && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">SYNCING SPRINT SYSTEM CONFIG...</p>
      </div>
    );
  }

  const focusMinsToday = Math.round(focusSecondsToday / 60);
  // Don't use Math.max(10,...) — that forces a fake 10m distracted even on zero data
  const distractedMinsToday = Math.max(0, Math.round((totalSecondsToday - focusSecondsToday) / 60));
  const progressPercent = Math.min(100, Math.round((focusMinsToday / targetGoal) * 100));

  // Chart 3: Donut chart data
  const donutData = focusMinsToday === 0 && distractedMinsToday === 0
    ? [{ name: 'No sessions today', value: 1, color: '#313540' }]
    : [
        { name: 'Focus', value: focusMinsToday, color: '#00FFA3' },
        { name: 'Distracted', value: distractedMinsToday, color: '#FF0055' }
      ];

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top welcome banner */}
      <header className="pb-4 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight flex items-center gap-2">
            <span>Main Command Rig</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">Sprints telemetry, active task trackers, and weekly logs</p>
        </div>
        
        {/* Wallet credit display */}
        <div 
          onClick={() => router.push('/wallet')}
          className="flex items-center gap-3 bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-surface-container border border-amber-500/40 rounded-xl p-3 select-none cursor-pointer hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all group"
          title="Open Wallet"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-base animate-pulse">payments</span>
          </div>
          <div>
            <p className="font-label-mono text-[8px] text-amber-400/90 uppercase font-bold tracking-widest">Stakes Balance</p>
            <p className="font-mono text-sm font-bold text-white flex items-center gap-1">
              <span>{wallet?.balance ?? 0}</span>
              <span className="text-[10px] text-amber-400 font-normal">TKN</span>
            </p>
          </div>
        </div>
      </header>

      {/* Grid structure: Goal rings progress + Money Match Coming Soon Widget + quick stats cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6 cols): Progress Circular Gauge */}
        <div className="lg:col-span-6 card-base p-6 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-surface-container border border-emerald-500/30 relative overflow-hidden group hover:border-emerald-400 transition-all shadow-[0_0_25px_rgba(0,255,163,0.1)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="font-label-mono text-label-mono text-emerald-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm animate-spin">timelapse</span>
                <span>Today's Focus Time</span>
              </h2>
              <div className="font-display text-4xl font-extrabold text-white mb-3 flex items-baseline gap-2">
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">{Math.floor(focusMinsToday / 60)}h {focusMinsToday % 60}m</span>
                <span className="font-label-mono text-xs text-emerald-400/80">/ {targetGoal}m target</span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm mb-6 leading-relaxed">
                You are in the top 15% of users today. Complete tasks and study in squads to boost payouts.
              </p>
              <button 
                onClick={() => router.push('/study')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 border border-emerald-400 py-2.5 px-6 rounded-lg font-label-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:scale-[1.03] group/btn"
              >
                <span>Launch Focus Session</span>
                <span className="material-symbols-outlined text-xs group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-variant/40" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-emerald-400 drop-shadow-[0_0_10px_rgba(0,255,163,0.8)] transition-all duration-1000 ease-out" 
                  cx="50" 
                  cy="50" 
                  fill="transparent" 
                  r="42" 
                  stroke="currentColor" 
                  strokeDasharray="263.8" 
                  strokeDashoffset={263.8 - (263.8 * progressPercent) / 100} 
                  strokeLinecap="round" 
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-black text-white">{progressPercent}%</span>
                <span className="font-label-mono text-[8px] text-emerald-400 uppercase tracking-widest font-bold">Goal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column (3 cols): Small Money Matches Coming Soon Widget */}
        <div className="lg:col-span-3">
          <MoneyMatchWidget />
        </div>

        {/* Right Column (3 cols): Quick stats cards & Level Badges */}
        <div className="lg:col-span-3 grid grid-rows-3 gap-3">
          
          {/* Card 1: Verified Badge */}
          <div className="card-base p-3.5 flex items-center justify-between bg-gradient-to-r from-purple-500/15 via-indigo-500/5 to-surface-container border border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:rotate-45 transition-transform duration-500">
                <span className="material-symbols-outlined text-base animate-pulse">verified</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-purple-300 uppercase font-bold">Verified Arena Badge</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-display text-xs font-bold text-white">Level {profile?.level || 1}</span>
                  <VerifiedBadge level={profile?.level || 1} size="sm" showLevelNumber={false} />
                </div>
              </div>
            </div>
            <span className="font-label-mono text-[9px] text-purple-300 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]">
              {profile?.points || 0} XP
            </span>
          </div>

          {/* Card 2: Current Streak */}
          <div className="card-base p-3.5 flex items-center justify-between bg-gradient-to-r from-orange-500/15 via-amber-500/5 to-surface-container border border-orange-500/30 hover:border-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-base text-orange-400 animate-bounce">local_fire_department</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-orange-300 uppercase font-bold">Current Streak</p>
                <p className="font-display text-sm font-black text-white">{streakDays} Days</p>
              </div>
            </div>
            <span className="font-label-mono text-[9px] text-orange-300 bg-orange-950/80 border border-orange-800/60 px-2 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)]">
              {streakDays > 0 ? '🔥 Active' : 'Start today'}
            </span>
          </div>

          {/* Card 3: Sessions Today */}
          <div className="card-base p-3.5 flex items-center justify-between bg-gradient-to-r from-cyan-500/15 via-blue-500/5 to-surface-container border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:rotate-180 transition-transform duration-700">
                <span className="material-symbols-outlined text-base animate-pulse">timer</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-cyan-300 uppercase font-bold">Sessions Today</p>
                <p className="font-display text-sm font-black text-white">{totalSessionsToday} Runs</p>
              </div>
            </div>
            <span className="font-label-mono text-[9px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
              Verified
            </span>
          </div>

        </div>
      </div>

      {/* Interactive Productivity Suite Widgets */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-base animate-pulse">widgets</span>
            </div>
            <span>Productivity Suite Controls &amp; Widgets</span>
          </h3>
          <button 
            onClick={() => router.push('/tasks')}
            className="text-xs font-mono text-emerald-400 hover:text-cyan-400 transition cursor-pointer font-bold flex items-center gap-1 hover:translate-x-0.5 transition-transform"
          >
            <span>Open Full Productivity Hub</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <TaskWidget />
          <CalendarWidget />
          <TimeTrackerWidget />
          <NoteWidget />
        </div>
      </div>

      {/* Main Charts: Grid containing 3 specific charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Log (Bar Chart) - 6 cols */}
        <div className="lg:col-span-6 card-base p-5 space-y-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-surface-container border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-[0_0_20px_rgba(0,255,163,0.1)] group">
          <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-400 animate-pulse">bar_chart</span>
            <span>Weekly grind (Mins per Day)</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#00FFA3', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                <Bar dataKey="minutes" fill="#00FFA3" radius={[4, 4, 0, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Focus (Line Chart) - 6 cols */}
        <div className="lg:col-span-6 card-base p-5 space-y-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-surface-container border border-cyan-500/30 hover:border-cyan-400/60 transition-all shadow-[0_0_20px_rgba(0,229,255,0.1)] group">
          <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-cyan-400 animate-pulse">show_chart</span>
            <span>Hourly Focus (Mins per Hour)</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#00E5FF', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                <Line type="monotone" dataKey="minutes" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Donut Chart (Focus vs Non-Focus Ratio today) - 4 cols */}
        <div className="xl:col-span-4 card-base p-5 flex flex-col justify-between h-[360px] bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-surface-container border border-purple-500/30 hover:border-purple-400/60 transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] group">
          <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-purple-400 animate-spin">pie_chart</span>
            <span>Focus Ratio breakdown</span>
          </h3>
          
          <div className="relative flex-grow flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-lg font-bold text-white">{focusMinsToday}m</span>
              <span className="text-[7px] text-purple-300 uppercase tracking-widest font-bold">Focus</span>
            </div>
          </div>

          <div className="flex justify-around text-[10px] font-mono border-t border-purple-500/20 pt-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(0,255,163,0.6)]"></span> Focus ({focusMinsToday}m)</span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> Distracted ({distractedMinsToday}m)</span>
          </div>
        </div>

        {/* Objectives list - 4 cols */}
        <div className="xl:col-span-4 card-base flex flex-col h-[360px] overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-surface-container border border-indigo-500/30 hover:border-indigo-400/60 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/20">
            <h3 className="font-display text-sm font-bold text-white uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-indigo-400 animate-pulse">task_alt</span>
              <span>Sprint Objectives</span>
            </h3>
            <span className="font-label-mono text-[10px] text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/40">{tasks.length} active</span>
          </div>
          
          <form onSubmit={handleAddTask} className="p-3 border-b border-indigo-500/20 bg-surface/80 flex gap-2">
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New objective..."
              className="flex-1 bg-background border border-indigo-500/30 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
            <select
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value)}
              className="bg-background border border-indigo-500/30 rounded px-1 py-1 text-[10px] text-white focus:outline-none font-mono"
            >
              <option value="Engineering">Eng</option>
              <option value="Mathematics">Math</option>
              <option value="Physics">Phys</option>
              <option value="Design">Des</option>
            </select>
            <button 
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-mono font-bold px-3 rounded transition-transform hover:scale-105 flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(0,255,163,0.3)]"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </form>

          <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-[11px] text-indigo-300/80 font-label-mono mb-2">No active sprint objectives</p>
                <button
                  onClick={() => router.push('/study')}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-mono text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer hover:scale-105 shadow-[0_0_12px_rgba(0,255,163,0.3)]"
                >
                  + Start Free Study Session
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {tasks.map(task => (
                  <li 
                    key={task.id} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-950/20 hover:bg-indigo-950/40 transition-all ${
                      task.completed ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-3.5 h-3.5 text-emerald-400 bg-background border-indigo-500/40 rounded focus:ring-emerald-400 cursor-pointer shrink-0"
                      />
                      <div 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="flex flex-col min-w-0 cursor-pointer group"
                      >
                        <span className={`text-xs text-white truncate group-hover:text-emerald-400 transition-colors ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">
                          Focus: {taskFocusMinutes[task.title.trim().toLowerCase()] || 0}m / {task.planned_minutes}m target ⚡ Start
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-neutral-950 p-1 rounded transition-colors text-[10px] font-mono font-bold cursor-pointer"
                        title="Start Sprint"
                      >
                        <span className="material-symbols-outlined text-xs font-bold">play_arrow</span>
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-rose-400 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                        title="Delete Objective"
                      >
                        <span className="material-symbols-outlined text-xs font-bold">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Lobbies list (Joined Squads) - 4 cols */}
        <div className="xl:col-span-4 card-base flex flex-col h-[360px] overflow-hidden bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-surface-container border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-[0_0_20px_rgba(0,255,163,0.1)]">
          <div className="p-4 border-b border-emerald-500/20 flex justify-between items-center bg-emerald-950/20">
            <h3 className="font-display text-sm font-bold text-white uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Joined Squads</span>
            </h3>
            <span className="font-label-mono text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">{liveRooms.length} active</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {liveRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-[11px] text-emerald-300/80 font-label-mono">No active arena memberships</p>
                <button 
                  onClick={() => router.push('/rooms')}
                  className="mt-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 px-4 py-1.5 rounded font-label-mono text-[10px] font-bold transition-all hover:scale-105 cursor-pointer shadow-[0_0_12px_rgba(0,255,163,0.3)]"
                >
                  Browse &amp; Join Squads
                </button>
              </div>
            ) : (
              liveRooms.map(room => (
                <div 
                  key={room.id}
                  className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 hover:border-emerald-400 transition-all cursor-pointer group"
                  onClick={() => router.push(`/study?roomId=${room.id}`)}
                >
                  <div className="min-w-0">
                    <h4 className="font-display text-xs font-bold text-white truncate uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{room.name}</h4>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="font-mono text-[8px] text-emerald-300 uppercase tracking-widest inline-block font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        #{room.type} • {room.max_members} max
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-widest inline-block font-bold">
                        Focus: {roomFocusMinutes[room.id] || 0}m
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/study?roomId=${room.id}`);
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-[9px] font-bold py-1.5 px-3.5 rounded transition-all hover:scale-105 cursor-pointer shrink-0 shadow-[0_0_10px_rgba(0,255,163,0.3)]"
                  >
                    Launch Arena
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Duel History & Study Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Arena Battle Duels Log (6 cols) */}
        <div className="lg:col-span-6 card-base p-5 flex flex-col h-[380px] overflow-hidden bg-gradient-to-br from-amber-500/10 via-red-500/5 to-surface-container border border-amber-500/30 hover:border-amber-400/60 transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <div className="flex justify-between items-center pb-3 border-b border-amber-500/20 mb-4 bg-amber-950/20 p-2 rounded-lg">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-amber-400 animate-bounce">swords</span>
              <span>Arena Battle Duels</span>
            </h3>
            <span className="font-label-mono text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/40">
              {allSessionsList.filter(s => s.opponent_name).length} Duels
            </span>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
            {allSessionsList.filter(s => s.opponent_name).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                <p className="text-xs text-amber-300/80 font-mono uppercase">No duel history found.</p>
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-mono text-[10px] font-bold px-4 py-2 rounded transition-transform hover:scale-105 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                >
                  Challenge a Squad Member
                </button>
              </div>
            ) : (
              allSessionsList.filter(s => s.opponent_name).map(duel => {
                const date = new Date(duel.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const myMins = Math.round(duel.focus_seconds / 60);
                const oppMins = Math.round(duel.opponent_focus_seconds / 60);
                return (
                  <div key={duel.id} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 font-mono">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                          duel.is_winner 
                            ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,163,0.3)]'
                            : 'text-rose-400 bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        }`}>
                          {duel.is_winner ? 'VICTORY' : 'DEFEAT'}
                        </span>
                        {duel.hands_down_forfeited && (
                          <span className="text-[8px] text-amber-300/80 uppercase font-bold">(Forfeited)</span>
                        )}
                      </div>
                      <h4 className="font-display text-xs font-bold text-white truncate uppercase tracking-tight mt-1.5">
                        VS {duel.opponent_name}
                      </h4>
                      <p className="text-[9px] text-amber-300/90 uppercase mt-0.5">
                        You: {myMins}m | Opponent: {oppMins}m
                      </p>
                    </div>
                    <span className="text-[9px] text-amber-300/70 shrink-0">{date}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Study Sessions Log (6 cols) */}
        {(() => {
          const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
          const recentTwoDaySessions = allSessionsList.filter(s => new Date(s.start_time) >= twoDaysAgo);

          return (
            <div className="lg:col-span-6 card-base p-5 flex flex-col h-[380px] overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-surface-container border border-cyan-500/30 hover:border-cyan-400/60 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20 mb-4 bg-cyan-950/20 p-2 rounded-lg">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-cyan-400 animate-spin">history</span>
                  <span>Recent Study Sessions</span>
                </h3>
                <span className="font-label-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/40">{recentTwoDaySessions.length} in last 48h</span>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                {recentTwoDaySessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <p className="text-xs text-cyan-300/80 font-mono">No study sessions recorded in the last 2 days.</p>
                    <button
                      onClick={() => router.push('/study')}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-mono text-[10px] font-bold px-4 py-2 rounded transition-transform hover:scale-105 cursor-pointer shadow-[0_0_12px_rgba(0,255,163,0.3)]"
                    >
                      Start New Session
                    </button>
                  </div>
                ) : (
                  recentTwoDaySessions.map(session => {
                    const date = new Date(session.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    const totalMin = Math.round((session.total_seconds || 0) / 60);
                    const focusMin = Math.round((session.focus_seconds || 0) / 60);
                    const ratio = session.total_seconds > 0 ? Math.round((session.focus_seconds / session.total_seconds) * 100) : 0;
                    
                    const roomType = session.rooms?.type;
                    const typeLabel = roomType 
                      ? `Arena: ${roomType.charAt(0).toUpperCase() + roomType.slice(1)}` 
                      : 'Self Mode';
                    const badgeColor = roomType === 'money' 
                      ? 'text-amber-400 bg-amber-500/20 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : roomType === 'private'
                      ? 'text-purple-400 bg-purple-500/20 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                      : roomType === 'public'
                      ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,163,0.2)]'
                      : 'text-cyan-300 bg-cyan-950/80 border-cyan-800/40';

                    return (
                      <div 
                        key={session.id} 
                        className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between gap-3 font-mono group hover:border-cyan-400 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <h4 className="font-display text-xs font-bold text-white truncate uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                            {session.name || 'Untitled Study Session'}
                          </h4>
                          <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold mt-1">
                            Focus: {focusMin}m / {totalMin}m ({ratio}%)
                          </p>
                          <p className="text-[8px] text-cyan-300/70 uppercase mt-0.5">
                            🖥️ {Math.round((session.screen_focus_seconds || 0) / 60)}m / 📝 {Math.round((session.paper_focus_seconds || 0) / 60)}m
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[9px] text-cyan-300/70">{date}</span>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="text-rose-400/90 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold"
                            title="Delete Session Record"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Challenge Squad Member Interactive Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-container-low border border-[#00ffa3]/30 w-full max-w-md rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,163,0.15)] space-y-5 text-on-surface font-mono relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00ffa3]">swords</span>
                <h2 className="font-display text-base font-extrabold uppercase text-white tracking-wider">
                  Challenge Squad Member
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChallengeModalOpen(false);
                  setSelectedOpponentUser(null);
                  setChallengeOpponent('');
                  setUserSearchResults([]);
                }}
                className="text-on-surface-variant hover:text-white text-sm cursor-pointer p-1 rounded-lg hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSquadChallenge} className="space-y-4">
              
              {/* Squad Member Username / Handle with Live Search */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Squad Member Username / Handle
                </label>

                {selectedOpponentUser ? (
                  /* Selected Opponent User Badge */
                  <div className="flex items-center justify-between p-2.5 bg-[#00ffa3]/10 border border-[#00ffa3]/40 rounded-xl text-xs text-white">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={selectedOpponentUser.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
                        alt={selectedOpponentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-[#00ffa3]"
                      />
                      <div>
                        <p className="font-extrabold text-[#00ffa3]">{selectedOpponentUser.name}</p>
                        <p className="text-[9px] text-on-surface-variant">{selectedOpponentUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOpponentUser(null);
                        setChallengeOpponent('');
                      }}
                      className="text-xs text-on-surface-variant hover:text-red-400 p-1 cursor-pointer"
                      title="Change user"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Search by username or email (e.g. prashantsingh)"
                        value={challengeOpponent}
                        onChange={(e) => setChallengeOpponent(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 py-2 text-xs text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-[#00ffa3]"
                      />
                      {searchingUsers && (
                        <span className="absolute right-3 top-2.5 text-[10px] text-primary-fixed animate-pulse">
                          Searching...
                        </span>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-surface-container-lowest border border-[#00ffa3]/30 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-outline-variant/20">
                        {userSearchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedOpponentUser(u);
                              setChallengeOpponent(u.name);
                              setUserSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-[#00ffa3]/10 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
                                alt={u.name}
                                className="w-6 h-6 rounded-full object-cover border border-outline-variant/40"
                              />
                              <div>
                                <p className="text-xs font-bold text-white">{u.name}</p>
                                <p className="text-[9px] text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-[#00ffa3] bg-[#00ffa3]/10 px-2 py-0.5 rounded border border-[#00ffa3]/30">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Challenge Battle Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Challenge Battle Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1v1 Deep Work Duel"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 py-2 text-xs text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-[#00ffa3]"
                />
              </div>

              {/* Sprint Duration Options */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1.5">
                  Focus Sprint Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setChallengeDuration(mins)}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                        challengeDuration === mins
                          ? 'bg-[#00ffa3]/20 text-[#00ffa3] border-[#00ffa3] shadow-[0_0_10px_rgba(0,255,163,0.2)]'
                          : 'bg-surface-container-lowest/60 border-outline-variant/30 text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Wager Options (with Coming Soon Banner) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                    Token Stake Wager
                  </label>
                  <span className="text-[8px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    ⚡ Token Stakes Coming Soon
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 opacity-80">
                  <button
                    type="button"
                    onClick={() => setChallengeStake(0)}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      challengeStake === 0
                        ? 'bg-[#00ffa3]/20 text-[#00ffa3] border-[#00ffa3] shadow-[0_0_10px_rgba(0,255,163,0.2)]'
                        : 'bg-surface-container-lowest/60 border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    Friendly
                  </button>
                  {[25, 50, 100].map((stake) => (
                    <button
                      key={stake}
                      type="button"
                      disabled
                      title="Real-money Token Stakes feature coming soon!"
                      className="py-2 text-xs font-bold rounded-xl border bg-surface-container-lowest/30 border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed flex flex-col items-center justify-center"
                    >
                      <span>{stake} TKN</span>
                      <span className="text-[7px] text-yellow-400 font-normal">Soon</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsChallengeModalOpen(false);
                    setSelectedOpponentUser(null);
                    setChallengeOpponent('');
                    setUserSearchResults([]);
                  }}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingChallenge}
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider bg-[#00ffa3] text-black hover:bg-[#00ffa3]/90 rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.3)] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingChallenge ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">swords</span>
                      Launch Challenge
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
