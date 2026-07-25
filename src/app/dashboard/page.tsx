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
          <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Main Command Rig</h2>
          <p className="text-xs text-on-surface-variant mt-1">Sprints telemetry, active task trackers, and weekly logs</p>
        </div>
        
        {/* Wallet credit display */}
        <div 
          onClick={() => router.push('/wallet')}
          className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl p-3 select-none cursor-pointer hover:border-amber-500/50 transition-all"
          title="Open Wallet"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-fixed">
            <span className="material-symbols-outlined text-base">payments</span>
          </div>
          <div>
            <p className="font-label-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-widest">Stakes Balance</p>
            <p className="font-mono text-sm font-bold text-on-surface">
              {wallet?.balance ?? 0} <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
            </p>
          </div>
        </div>
      </header>

      {/* Grid structure: Goal rings progress + Money Match Coming Soon Widget + quick stats cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6 cols): Progress Circular Gauge */}
        <div className="lg:col-span-6 card-base p-6 bg-grid-pattern relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-container/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider mb-2">Today's Focus Time</h2>
              <div className="font-display text-4xl font-extrabold text-on-surface mb-3 flex items-baseline gap-2">
                <span>{Math.floor(focusMinsToday / 60)}h {focusMinsToday % 60}m</span>
                <span className="font-label-mono text-xs text-primary-fixed">/ {targetGoal}m target</span>
              </div>
              <p className="text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
                You are in the top 15% of users today. Complete tasks and study in squads to boost payouts.
              </p>
              <button 
                onClick={() => router.push('/study')}
                className="bg-surface-variant hover:bg-surface-bright text-on-surface border border-outline-variant py-2 px-6 rounded-lg font-label-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                Launch Focus Session
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-variant" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-primary-container drop-shadow-[0_0_6px_rgba(0,255,163,0.5)] transition-all duration-1000 ease-out" 
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
                <span className="font-display text-2xl font-black text-on-surface">{progressPercent}%</span>
                <span className="font-label-mono text-[8px] text-on-surface-variant uppercase tracking-widest font-bold">Goal</span>
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
          <div className="card-base p-3.5 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-sm">verified</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold">Verified Arena Badge</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-display text-xs font-bold text-on-surface">Level {profile?.level || 1}</span>
                  <VerifiedBadge level={profile?.level || 1} size="sm" showLevelNumber={false} />
                </div>
              </div>
            </div>
            <span className="font-label-mono text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
              {profile?.points || 0} XP
            </span>
          </div>

          <div className="card-base p-3.5 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold">Current Streak</p>
                <p className="font-display text-sm font-black text-on-surface">{streakDays} Days</p>
              </div>
            </div>
            <span className="font-label-mono text-[9px] text-primary-fixed bg-primary-container/10 px-2 py-0.5 rounded-full font-bold">
              {streakDays > 0 ? 'Active' : 'Start today'}
            </span>
          </div>

          <div className="card-base p-3.5 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary-fixed">
                <span className="material-symbols-outlined text-sm">timer</span>
              </div>
              <div>
                <p className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold">Sessions Today</p>
                <p className="font-display text-sm font-black text-on-surface">{totalSessionsToday} Runs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Productivity Suite Widgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary-fixed">widgets</span>
            Productivity Suite Controls & Widgets
          </h3>
          <button 
            onClick={() => router.push('/tasks')}
            className="text-xs font-mono text-primary-fixed hover:text-white transition cursor-pointer"
          >
            Open Full Productivity Hub →
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
        <div className="lg:col-span-6 card-base p-5 space-y-4">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Weekly grind (Mins per Day)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '10px' }} />
                <Bar dataKey="minutes" fill="#00FFA3" radius={[3, 3, 0, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Focus (Line Chart) - 6 cols */}
        <div className="lg:col-span-6 card-base p-5 space-y-4">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Hourly Focus (Mins per Hour)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="minutes" stroke="#00FFA3" strokeWidth={1.5} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Donut Chart (Focus vs Non-Focus Ratio today) - 4 cols */}
        <div className="xl:col-span-4 card-base p-5 flex flex-col justify-between h-[360px]">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Focus Ratio breakdown</h3>
          
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
              <span className="font-mono text-lg font-bold text-on-surface">{focusMinsToday}m</span>
              <span className="text-[7px] text-on-surface-variant uppercase tracking-widest font-bold">Focus</span>
            </div>
          </div>

          <div className="flex justify-around text-[10px] font-mono border-t border-outline-variant/30 pt-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary-container"></span> Focus ({focusMinsToday}m)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-error"></span> Distracted ({distractedMinsToday}m)</span>
          </div>
        </div>

        {/* Objectives list - 4 cols */}
        <div className="xl:col-span-4 card-base flex flex-col h-[360px] overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase">Sprint Objectives</h3>
            <span className="font-label-mono text-[10px] text-on-surface-variant">{tasks.length} active</span>
          </div>
          
          <form onSubmit={handleAddTask} className="p-3 border-b border-outline-variant bg-surface flex gap-2">
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New objective..."
              className="flex-1 bg-background border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
            />
            <select
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value)}
              className="bg-background border border-outline-variant rounded px-1 py-1 text-[10px] text-on-surface focus:outline-none font-mono"
            >
              <option value="Engineering">Eng</option>
              <option value="Mathematics">Math</option>
              <option value="Physics">Phys</option>
              <option value="Design">Des</option>
            </select>
            <button 
              type="submit"
              className="bg-primary-container text-on-primary px-2 rounded hover:bg-primary-fixed transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </form>

          <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-[11px] text-on-surface-variant font-label-mono mb-2">No active sprint objectives</p>
                <button
                  onClick={() => router.push('/study')}
                  className="bg-primary-container text-on-primary font-mono text-[10px] font-bold px-3 py-1.5 rounded hover:bg-primary-fixed transition cursor-pointer"
                >
                  + Start Free Study Session
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {tasks.map(task => (
                  <li 
                    key={task.id} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/35 bg-surface-container-lowest/60 hover:bg-surface-container-low transition-colors ${
                      task.completed ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-3.5 h-3.5 text-primary-container bg-background border-outline-variant rounded focus:ring-primary-container cursor-pointer shrink-0"
                      />
                      <div 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="flex flex-col min-w-0 cursor-pointer group"
                      >
                        <span className={`text-xs text-on-surface truncate group-hover:text-primary-fixed transition-colors ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-[9px] text-primary-fixed font-mono font-bold">
                          Focus: {taskFocusMinutes[task.title.trim().toLowerCase()] || 0}m / {task.planned_minutes}m target ⚡ Start
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="bg-primary-container/20 hover:bg-primary-container text-primary-fixed hover:text-on-primary p-1 rounded transition-colors text-[10px] font-mono font-bold cursor-pointer"
                        title="Start Sprint"
                      >
                        <span className="material-symbols-outlined text-xs font-bold">play_arrow</span>
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
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
        <div className="xl:col-span-4 card-base flex flex-col h-[360px] overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase">Joined Squads</h3>
            <span className="font-label-mono text-[10px] text-on-surface-variant">{liveRooms.length} active</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {liveRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-[11px] text-on-surface-variant font-label-mono">No active arena memberships</p>
                <button 
                  onClick={() => router.push('/rooms')}
                  className="mt-3 bg-secondary-container text-on-secondary px-4 py-1.5 rounded font-label-mono text-[10px] font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
                >
                  Browse & Join Squads
                </button>
              </div>
            ) : (
              liveRooms.map(room => (
                <div 
                  key={room.id}
                  className="p-3 bg-surface-container-lowest/60 border border-outline-variant/35 rounded-xl flex items-center justify-between gap-3 hover:border-secondary-fixed transition-all cursor-pointer"
                  onClick={() => router.push(`/study?roomId=${room.id}`)}
                >
                  <div className="min-w-0">
                    <h4 className="font-display text-xs font-bold text-on-surface truncate uppercase tracking-tight">{room.name}</h4>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest inline-block font-bold">
                        #{room.type} • {room.max_members} max
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      <span className="font-mono text-[8px] text-primary-fixed uppercase tracking-widest inline-block font-bold">
                        Focus: {roomFocusMinutes[room.id] || 0}m
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/study?roomId=${room.id}`);
                    }}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[9px] font-bold py-1.5 px-3.5 rounded transition-colors cursor-pointer shrink-0"
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
        <div className="lg:col-span-6 card-base p-5 flex flex-col h-[380px] overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30 mb-4 bg-surface-container-low/10">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#00ffa3]">swords</span>
              Arena Battle Duels
            </h3>
            <span className="font-label-mono text-[10px] text-on-surface-variant">
              {allSessionsList.filter(s => s.opponent_name).length} Duels
            </span>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
            {allSessionsList.filter(s => s.opponent_name).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                <p className="text-xs text-on-surface-variant font-mono uppercase">No duel history found.</p>
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-primary-container/20 text-primary-fixed border border-primary-fixed/30 hover:bg-primary-container hover:text-on-primary font-mono text-[10px] font-bold px-3 py-1.5 rounded transition cursor-pointer"
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
                  <div key={duel.id} className="p-3 bg-surface-container-lowest/60 border border-outline-variant/35 rounded-xl flex items-center justify-between gap-3 font-mono">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                          duel.is_winner 
                            ? 'text-[#00ffa3] bg-[#00ffa3]/10 border-[#00ffa3]/30 shadow-[0_0_5px_rgba(0,255,163,0.15)]'
                            : 'text-[#ff3b30] bg-[#ff3b30]/10 border-[#ff3b30]/30 shadow-[0_0_5px_rgba(255,59,48,0.15)]'
                        }`}>
                          {duel.is_winner ? 'VICTORY' : 'DEFEAT'}
                        </span>
                        {duel.hands_down_forfeited && (
                          <span className="text-[8px] text-on-surface-variant uppercase font-bold">(Forfeited)</span>
                        )}
                      </div>
                      <h4 className="font-display text-xs font-bold text-on-surface truncate uppercase tracking-tight mt-1.5">
                        VS {duel.opponent_name}
                      </h4>
                      <p className="text-[9px] text-on-surface-variant uppercase mt-0.5">
                        You: {myMins}m | Opponent: {oppMins}m
                      </p>
                    </div>
                    <span className="text-[9px] text-on-surface-variant shrink-0">{date}</span>
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
            <div className="lg:col-span-6 card-base p-5 flex flex-col h-[380px] overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30 mb-4 bg-surface-container-low/10">
                <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Recent Study Sessions</h3>
                <span className="font-label-mono text-[10px] text-on-surface-variant">{recentTwoDaySessions.length} in last 48h</span>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                {recentTwoDaySessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <p className="text-xs text-on-surface-variant font-mono">No study sessions recorded in the last 2 days.</p>
                    <button
                      onClick={() => router.push('/study')}
                      className="bg-primary-container text-on-primary font-mono text-[10px] font-bold px-4 py-2 rounded hover:bg-primary-fixed transition cursor-pointer"
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
                      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                      : roomType === 'private'
                      ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                      : roomType === 'public'
                      ? 'text-[#00ffa3] bg-[#00ffa3]/10 border-[#00ffa3]/30'
                      : 'text-on-surface-variant bg-surface-container border-outline-variant';

                    return (
                      <div 
                        key={session.id} 
                        className="p-3 bg-surface-container-lowest/60 border border-outline-variant/35 rounded-xl flex items-center justify-between gap-3 font-mono group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <h4 className="font-display text-xs font-bold text-on-surface truncate uppercase tracking-tight">
                            {session.name || 'Untitled Study Session'}
                          </h4>
                          <p className="text-[9px] text-primary-fixed uppercase tracking-wider font-bold mt-1">
                            Focus: {focusMin}m / {totalMin}m ({ratio}%)
                          </p>
                          <p className="text-[8px] text-on-surface-variant uppercase mt-0.5">
                            🖥️ {Math.round((session.screen_focus_seconds || 0) / 60)}m / 📝 {Math.round((session.paper_focus_seconds || 0) / 60)}m
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[9px] text-on-surface-variant">{date}</span>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="text-red-400/80 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold"
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
