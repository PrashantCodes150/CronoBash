"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Task, Room } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { VerifiedBadge } from '@/components/study/VerifiedBadge';
import GreetingBanner from '@/components/GreetingBanner';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TaskWidget } from '@/components/widgets/TaskWidget';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { TimeTrackerWidget } from '@/components/widgets/TimeTrackerWidget';
import { NoteWidget } from '@/components/widgets/NoteWidget';
import { MoneyMatchWidget } from '@/components/widgets/MoneyMatchWidget';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, wallet, refreshWallet } = useAuth();

  // Redirect new users who haven't completed onboarding to /onboarding
  useEffect(() => {
    if (!user) return;
    if (typeof window !== 'undefined') {
      const isLocalSeen = localStorage.getItem(`cronobash_has_seen_onboarding_${user.id}`) === 'true' || localStorage.getItem('cronobash_has_seen_onboarding') === 'true';
      if (isLocalSeen) return;
    }
    if (profile && profile.has_seen_onboarding === false) {
      router.replace('/onboarding');
    }
  }, [user, profile?.has_seen_onboarding, router]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'all' | 'focus' | 'productivity' | 'squads' | 'analytics'>('all');

  // Interactive Header Controls States
  const [isArenaDropdownOpen, setIsArenaDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isQuickSprintModalOpen, setIsQuickSprintModalOpen] = useState(false);
  const [quickSprintTitle, setQuickSprintTitle] = useState('');
  const [quickSprintDuration, setQuickSprintDuration] = useState(25);

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

  // Persistent Deleted Sessions Register
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

    addDeletedSessionId(String(sessionId));
    setAllSessionsList(prev => prev.filter(s => String(s.id) !== String(sessionId)));

    try {
      await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId);
    } catch (err) {
      console.error('Supabase session delete error:', err);
    }

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

  // Launch Quick Sprint Handler
  const handleStartQuickSprint = (e: React.FormEvent) => {
    e.preventDefault();
    const titleParam = encodeURIComponent(quickSprintTitle.trim() || 'Quick Focus Sprint');
    setIsQuickSprintModalOpen(false);
    router.push(`/study?taskTitle=${titleParam}&targetMins=${quickSprintDuration}`);
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

      if (selectedOpponentUser?.id) {
        await supabase.from('notifications').insert({
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
        toast.success(`Invite notification sent to ${selectedOpponentUser.name || 'squad member'}! 🚀`);
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
      const localToday = new Date();
      const localMidnightStart = new Date(
        localToday.getFullYear(), localToday.getMonth(), localToday.getDate(), 0, 0, 0, 0
      ).toISOString();
      const localMidnightEnd = new Date(
        localToday.getFullYear(), localToday.getMonth(), localToday.getDate(), 23, 59, 59, 999
      ).toISOString();

      let focusSum = 0;
      let totalSum = 0;

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

      const { data: profData } = await supabase
        .from('users')
        .select('daily_goal_minutes')
        .eq('id', user.id)
        .single();
      setTargetGoal(profile?.daily_goal_minutes || profData?.daily_goal_minutes || 120);

      const { data: tasksList } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('completed', { ascending: true });
      if (tasksList) setTasks(tasksList as Task[]);

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
          const key = dayNames[d.getDay()];
          if (key in dailyMinutes) {
            dailyMinutes[key] += Math.round((s.focus_seconds || 0) / 60);
          }
        }
      }

      setWeeklyChartData(
        Object.entries(dailyMinutes).map(([day, minutes]) => ({ day, minutes }))
      );

      const hourlyBuckets: Record<string, number> = {};
      for (let h = 0; h <= 22; h += 2) {
        const label = `${String(h).padStart(2, '0')}:00`;
        hourlyBuckets[label] = 0;
      }

      if (sessionsToday) {
        for (const s of sessionsToday) {
          const d = new Date(s.start_time);
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

      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('*, rooms(type)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (allSessions) {
        const deletedIds = getDeletedSessionIds();
        const activeSessions = allSessions.filter((s: any) => !deletedIds.has(String(s.id)));
        setAllSessionsList(activeSessions);

        const roomMinutes: Record<string, number> = {};
        const taskMinutes: Record<string, number> = {};

        activeSessions.forEach((s: any) => {
          if (s.room_id) {
            roomMinutes[s.room_id] = (roomMinutes[s.room_id] || 0) + Math.round((s.focus_seconds || 0) / 60);
          }
          if (s.name) {
            const taskKey = s.name.trim().toLowerCase();
            taskMinutes[taskKey] = (taskMinutes[taskKey] || 0) + Math.round((s.focus_seconds || 0) / 60);
          }
        });

        setRoomFocusMinutes(roomMinutes);
        setTaskFocusMinutes(taskMinutes);

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
        toast.success('Objective created! 🎯');
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
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#ECEFF6] rounded-[32px] p-8">
        <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-semibold text-sm mt-4 tracking-wide">LOADING DASHBOARD CONTROL...</p>
      </div>
    );
  }

  const focusMinsToday = Math.round(focusSecondsToday / 60);
  const distractedMinsToday = Math.max(0, Math.round((totalSecondsToday - focusSecondsToday) / 60));
  const progressPercent = Math.min(100, Math.round((focusMinsToday / targetGoal) * 100));

  const donutData = focusMinsToday === 0 && distractedMinsToday === 0
    ? [{ name: 'No sessions today', value: 1, color: '#E4E4E7' }]
    : [
        { name: 'Focus', value: focusMinsToday, color: '#3B82F6' },
        { name: 'Distracted', value: distractedMinsToday, color: '#8B5CF6' }
      ];

  // Filter tasks and rooms based on global search
  const filteredSearchTasks = tasks.filter(t => t.title.toLowerCase().includes(globalSearchQuery.toLowerCase().trim()));
  const filteredSearchRooms = liveRooms.filter(r => r.name.toLowerCase().includes(globalSearchQuery.toLowerCase().trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#fafaf9] min-h-screen text-[#1c1917] font-sans p-4 sm:p-6 md:p-8 rounded-[32px] space-y-6"
    >
      
      {/* ── GREETING BANNER (dashboard-only) ── */}
      <GreetingBanner />

      {/* ── TOP HEADER & FILTER TAB NAVIGATION ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Title & Pill Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto overflow-hidden">
          {/* Location Dropdown Pill */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsArenaDropdownOpen(!isArenaDropdownOpen)}
              className="bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2 cursor-pointer hover:shadow transition-all group"
            >
              <span className="font-extrabold text-xs sm:text-sm text-gray-900">Focus Arena</span>
              <span className={`material-symbols-outlined text-gray-400 text-base transition-transform ${isArenaDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Interactive Dropdown Menu Overlay */}
            {isArenaDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsArenaDropdownOpen(false)}></div>
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-40 animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Quick Rig Navigation
                  </div>
                  <ul className="space-y-1 pt-1 text-xs font-bold text-gray-700">
                    <li>
                      <button
                        onClick={() => { setActiveTab('all'); setIsArenaDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#3B82F6]">dashboard</span>
                        <span>Focus Arena Overview</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/rooms'); setIsArenaDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#10B981]">groups</span>
                        <span>Squad Battle Arenas</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/study'); setIsArenaDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#F59E0B]">schedule</span>
                        <span>Focus Study Room</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/tasks'); setIsArenaDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#3B82F6]">checklist</span>
                        <span>Task &amp; Objectives Hub</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/analytics'); setIsArenaDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#8B5CF6]">monitoring</span>
                        <span>Analytics &amp; Reports</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar py-1 w-full sm:w-auto max-w-full">
            {[
              { id: 'all', label: 'Overview' },
              { id: 'focus', label: 'Focus Sprints' },
              { id: 'productivity', label: 'Productivity' },
              { id: 'squads', label: 'Squad Arenas' },
              { id: 'analytics', label: 'Analytics' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'text-[#44474c] hover:text-[#1D1D1F] bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Circular Action Buttons */}
        <div className="flex items-center gap-3 self-end lg:self-auto">

          {/* Action Button 1: Add Challenge Duel (+) */}
          <button 
            onClick={() => setIsChallengeModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-white/80 text-gray-700 hover:text-gray-900 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
            title="Challenge Squad Member (+)"
          >
            <span className="material-symbols-outlined text-lg font-bold">add</span>
          </button>

          {/* Action Button 2: Global Search (🔍) */}
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-white/80 text-gray-700 hover:text-gray-900 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
            title="Search Tasks & Arenas (🔍)"
          >
            <span className="material-symbols-outlined text-lg font-bold">search</span>
          </button>

          {/* Action Button 3: Quick Sprint Launcher (✎) */}
          <button 
            onClick={() => setIsQuickSprintModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-white/80 text-gray-700 hover:text-gray-900 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
            title="Quick Sprint & Note (✎)"
          >
            <span className="material-symbols-outlined text-lg font-bold">edit</span>
          </button>
        </div>
      </div>

      {/* ── UPPER GRID: FOCUS TIME RING CARD + MONEY MATCH WIDGET + STATS CAPSULES ── */}
      {(activeTab === 'all' || activeTab === 'focus') && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          
          {/* Today's Focus Ring Card (6 cols) */}
          <div className="lg:col-span-6 morphism-card p-6 sm:p-7 bg-white flex flex-col justify-between relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-xl font-bold">timelapse</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-[#3B82F6] uppercase tracking-wider">Today's Focus Time</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Daily Target: {targetGoal}m</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-4xl font-black text-gray-900 tracking-tight">
                    {Math.floor(focusMinsToday / 60)}h {focusMinsToday % 60}m
                  </span>
                  <span className="text-xs font-bold text-gray-400">/ {targetGoal}m</span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  You are in the top 15% of focus fighters today. Complete objectives and study in squad lobbies to boost rewards!
                </p>

                <div className="pt-2">
                  <button 
                    onClick={() => router.push('/study')}
                    className="bg-[#1D1D1F] hover:bg-black text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 group/btn text-xs"
                  >
                    <span>Launch Focus Session</span>
                    <span className="material-symbols-outlined text-xs group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Circular Progress Gauge */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-100" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="9"></circle>
                  <circle 
                    className="text-[#3B82F6] transition-all duration-1000 ease-out" 
                    cx="50" 
                    cy="50" 
                    fill="transparent" 
                    r="42" 
                    stroke="currentColor" 
                    strokeDasharray="263.8" 
                    strokeDashoffset={263.8 - (263.8 * progressPercent) / 100} 
                    strokeLinecap="round" 
                    strokeWidth="9"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900">{progressPercent}%</span>
                  <span className="text-[10px] text-[#3B82F6] font-extrabold uppercase tracking-widest">Goal</span>
                </div>
              </div>

            </div>
          </div>

          {/* Money Match Widget (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-center">
            <MoneyMatchWidget />
          </div>

          {/* Quick Stats Column (3 cols) */}
          <div className="lg:col-span-3 grid grid-rows-3 gap-3">
            
            {/* Stat 1: Verified Arena Badge */}
            <div className="morphism-card p-4 flex items-center justify-between bg-white group cursor-pointer hover:border-[#10B981] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arena Rank</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black text-gray-900">Level {profile?.level || 1}</span>
                    <VerifiedBadge level={profile?.level || 1} size="sm" showLevelNumber={false} />
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/20">
                {profile?.points || 0} XP
              </span>
            </div>

            {/* Stat 2: Current Streak */}
            <div className="morphism-card p-4 flex items-center justify-between bg-white group cursor-pointer hover:border-[#F59E0B] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-gray-900 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-lg">local_fire_department</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Daily Streak</p>
                  <p className="text-sm font-black text-gray-900">{streakDays} Days</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#F59E0B]/20">
                {streakDays > 0 ? '🔥 Active' : 'Start today'}
              </span>
            </div>

            {/* Stat 3: Sessions Today */}
            <div className="morphism-card p-4 flex items-center justify-between bg-white group cursor-pointer hover:border-[#6366F1] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-lg">timer</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sessions Today</p>
                  <p className="text-sm font-black text-gray-900">{totalSessionsToday} Runs</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4338CA] bg-[#EEF2FF] px-2.5 py-1 rounded-full border border-[#6366F1]/20">
                Verified
              </span>
            </div>

          </div>

        </motion.div>
      )}



      {/* ── PRODUCTIVITY SUITE CONTROLS & WIDGETS ── */}
      {(activeTab === 'all' || activeTab === 'productivity') && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="space-y-4 pt-2"
        >
          <div className="flex items-center justify-between border-b border-gray-200/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">widgets</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                Productivity Controls &amp; Widgets
              </h3>
            </div>
            <button 
              onClick={() => router.push('/tasks')}
              className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer flex items-center gap-1 hover:translate-x-0.5 transition-transform"
            >
              <span>Open Full Productivity Hub</span>
              <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}><TaskWidget /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.33 }}><CalendarWidget /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.41 }}><TimeTrackerWidget /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.49 }}><NoteWidget /></motion.div>
          </div>
        </motion.div>
      )}

      {/* ── MAIN ANALYTICS CHARTS (Weekly Grind & Hourly Focus) ── */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2"
        >
          
          {/* Weekly Focus Bar Chart (6 cols) */}
          <div className="lg:col-span-6 morphism-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#6366F1] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm font-bold">bar_chart</span>
                </div>
                <span>Weekly Grind (Mins per Day)</span>
              </h4>
              <span className="text-[11px] font-semibold text-gray-400">Last 7 Days</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#9E9E9E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9E9E9E" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#6366F1', borderRadius: '16px', fontSize: '11px', color: '#1D1D1F', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="minutes" fill="#6366F1" radius={[8, 8, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Focus Line Chart (6 cols) */}
          <div className="lg:col-span-6 morphism-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm font-bold">show_chart</span>
                </div>
                <span>Hourly Focus Rhythm (Today)</span>
              </h4>
              <span className="text-[11px] font-semibold text-gray-400">2-Hour Buckets</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9E9E9E" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9E9E9E" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#3B82F6', borderRadius: '16px', fontSize: '11px', color: '#1D1D1F', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="minutes" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </motion.div>
      )}

      {/* ── RATIO BREAKDOWN & OBJECTIVES & JOINED SQUAD ARENAS ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2"
      >
        
        {/* Focus Donut Breakdown - 4 cols */}
        <div className="xl:col-span-4 morphism-card p-6 flex flex-col justify-between h-[380px] bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-sm font-bold">pie_chart</span>
            </div>
            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              Focus Ratio Breakdown
            </h4>
          </div>
          
          <div className="relative flex-grow flex items-center justify-center">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#8B5CF6'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-gray-900">{focusMinsToday}m</span>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Focus</span>
            </div>
          </div>

          <div className="flex justify-around text-xs border-t border-gray-100 pt-4 font-bold">
            <span className="flex items-center gap-1.5 text-[#3B82F6]"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span> Focus ({focusMinsToday}m)</span>
            <span className="flex items-center gap-1.5 text-[#8B5CF6]"><span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span> Distracted ({distractedMinsToday}m)</span>
          </div>
        </div>

        {/* Sprint Objectives list - 4 cols */}
        <div className="xl:col-span-4 morphism-card flex flex-col h-[380px] overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-sm font-bold">task_alt</span>
              </div>
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                Sprint Objectives
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">{tasks.length} active</span>
          </div>
          
          <form onSubmit={handleAddTask} className="p-3 border-b border-gray-100 bg-white flex gap-2">
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add new objective..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#3B82F6]"
            />
            <button 
              type="submit"
              className="bg-[#1D1D1F] hover:bg-black text-white font-bold px-4 rounded-xl text-xs transition-transform hover:scale-105 flex items-center justify-center cursor-pointer shadow-sm"
            >
              +
            </button>
          </form>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-gray-400 font-medium mb-3">No active sprint objectives</p>
                <button
                  onClick={() => router.push('/study')}
                  className="bg-[#3B82F6] text-white text-xs font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-sm"
                >
                  + Launch Free Sprint
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {tasks.map(task => (
                  <li 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white transition-all ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-4 h-4 text-[#3B82F6] bg-white border-gray-300 rounded focus:ring-[#3B82F6] cursor-pointer shrink-0"
                      />
                      <div 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="flex flex-col min-w-0 cursor-pointer group"
                      >
                        <span className={`text-xs font-bold text-gray-900 truncate group-hover:text-[#3B82F6] transition-colors ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-[#3B82F6] font-semibold">
                          Focus: {taskFocusMinutes[task.title.trim().toLowerCase()] || 0}m / {task.planned_minutes}m target
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => router.push(`/study?taskTitle=${encodeURIComponent(task.title)}&taskId=${task.id}`)}
                        className="bg-[#DBEAFE] text-[#1E40AF] p-1.5 rounded-xl hover:scale-105 transition-transform text-xs font-bold cursor-pointer"
                        title="Start Sprint"
                      >
                        <span className="material-symbols-outlined text-xs font-bold">play_arrow</span>
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 cursor-pointer"
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

        {/* Joined Squad Arenas - 4 cols */}
        <div className="xl:col-span-4 morphism-card flex flex-col h-[380px] overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-sm font-bold">groups</span>
              </div>
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                Joined Squad Arenas
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">{liveRooms.length} active</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2.5">
            {liveRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-gray-400 font-medium">No active arena memberships</p>
                <button 
                  onClick={() => router.push('/rooms')}
                  className="mt-3 bg-[#10B981] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm"
                >
                  Browse &amp; Join Squads
                </button>
              </div>
            ) : (
              liveRooms.map(room => (
                <div 
                  key={room.id}
                  className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3 hover:border-[#10B981] transition-all cursor-pointer group"
                  onClick={() => router.push(`/study?roomId=${room.id}`)}
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#10B981] transition-colors">{room.name}</h5>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] text-gray-500 uppercase font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        #{room.type} • {room.max_members} max
                      </span>
                      <span className="text-[10px] text-[#10B981] font-bold">
                        Focus: {roomFocusMinutes[room.id] || 0}m
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/study?roomId=${room.id}`);
                    }}
                    className="bg-[#1D1D1F] text-white text-[10px] font-bold py-2 px-3.5 rounded-xl transition-all hover:scale-105 cursor-pointer shrink-0 shadow-sm"
                  >
                    Launch Arena
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </motion.div>

      {/* ── BATTLE DUELS & RECENT STUDY LOGS ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2"
      >
        
        {/* Battle Duels Log (6 cols) */}
        <div className="lg:col-span-6 morphism-card p-6 flex flex-col h-[380px] overflow-hidden bg-white">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4 bg-gray-50/80 p-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-sm font-bold">swords</span>
              </div>
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                Arena Battle Duels
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
              {allSessionsList.filter(s => s.opponent_name).length} Duels
            </span>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
            {allSessionsList.filter(s => s.opponent_name).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium">No battle duels logged yet.</p>
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2 rounded-xl transition-transform hover:scale-105 cursor-pointer shadow-sm"
                >
                  Challenge Squad Member
                </button>
              </div>
            ) : (
              allSessionsList.filter(s => s.opponent_name).map(duel => {
                const date = new Date(duel.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const myMins = Math.round(duel.focus_seconds / 60);
                const oppMins = Math.round(duel.opponent_focus_seconds / 60);
                return (
                  <div key={duel.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          duel.is_winner 
                            ? 'text-[#059669] bg-[#D1FAE5]'
                            : 'text-[#DC2626] bg-[#FEE2E2]'
                        }`}>
                          {duel.is_winner ? 'VICTORY' : 'DEFEAT'}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-xs text-gray-900 truncate mt-1">
                        VS {duel.opponent_name}
                      </h5>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        You: {myMins}m | Opponent: {oppMins}m
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold shrink-0">{date}</span>
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
            <div className="lg:col-span-6 morphism-card p-6 flex flex-col h-[380px] overflow-hidden bg-white">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4 bg-gray-50/80 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F59E0B] text-gray-900 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-sm font-bold">history</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    Recent Study Sessions
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">{recentTwoDaySessions.length} in last 48h</span>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                {recentTwoDaySessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <p className="text-xs text-gray-400 font-medium">No sessions recorded in the last 2 days.</p>
                    <button
                      onClick={() => router.push('/study')}
                      className="bg-[#F59E0B] text-gray-900 text-xs font-bold px-4 py-2 rounded-xl transition-transform hover:scale-105 cursor-pointer shadow-sm"
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

                    return (
                      <div 
                        key={session.id} 
                        className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3 text-xs group hover:border-[#F59E0B] transition-all"
                      >
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-gray-900 truncate group-hover:text-[#F59E0B] transition-colors">
                            {session.name || 'Untitled Study Session'}
                          </h5>
                          <p className="text-[10px] text-[#D97706] font-bold mt-0.5">
                            Focus: {focusMin}m / {totalMin}m ({ratio}%)
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400 font-semibold">{date}</span>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Delete Session Record"
                          >
                            <span className="material-symbols-outlined text-[12px] font-bold">delete</span>
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

      </motion.div>

      {/* ── MODAL 1: CHALLENGE SQUAD MEMBER MODAL (+) ── */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-gray-900 relative">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] font-bold">swords</span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Challenge Squad Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChallengeModalOpen(false);
                  setSelectedOpponentUser(null);
                  setChallengeOpponent('');
                  setUserSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSquadChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Duel Title</label>
                <input
                  type="text"
                  required
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  placeholder="e.g. 1v1 Focus Duel"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Search Squad Member (Name or Email)</label>
                <input
                  type="text"
                  value={selectedOpponentUser ? selectedOpponentUser.name || selectedOpponentUser.email : challengeOpponent}
                  onChange={(e) => {
                    setSelectedOpponentUser(null);
                    setChallengeOpponent(e.target.value);
                  }}
                  placeholder="Type squad member name..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#3B82F6]"
                />

                {searchingUsers && (
                  <span className="absolute right-3 top-8 text-[10px] text-gray-400">Searching...</span>
                )}

                {userSearchResults.length > 0 && !selectedOpponentUser && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-40 overflow-y-auto">
                    {userSearchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedOpponentUser(u);
                          setChallengeOpponent(u.name || u.email);
                          setUserSearchResults([]);
                        }}
                        className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-gray-800">{u.name || u.email}</span>
                        </div>
                        <span className="text-[10px] font-black text-[#3B82F6]">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sprint Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setChallengeDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        challengeDuration === mins
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Token Stake Wager (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={challengeStake}
                  onChange={(e) => setChallengeStake(Number(e.target.value))}
                  placeholder="0 Tokens"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChallengeModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingChallenge}
                  className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {creatingChallenge ? 'Creating...' : 'Send Challenge 🚀'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: LIVE UNIVERSAL SEARCH MODAL (🔍) ── */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-lg rounded-[28px] p-6 shadow-2xl space-y-4 text-gray-900 relative">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] font-bold">search</span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Universal Search Hub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setGlobalSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search tasks, objectives, squad lobbies..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#3B82F6]"
            />

            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-3 pt-1">
              {globalSearchQuery.trim() === '' ? (
                <p className="text-xs text-gray-400 text-center py-6 font-medium">Type any keyword to search active objectives and squad arenas</p>
              ) : (
                <>
                  {/* Matching Tasks */}
                  <div>
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Objectives</h4>
                    {filteredSearchTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No matching objectives</p>
                    ) : (
                      filteredSearchTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setIsSearchModalOpen(false);
                            router.push(`/study?taskTitle=${encodeURIComponent(t.title)}&taskId=${t.id}`);
                          }}
                          className="p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between border border-gray-100 mb-1"
                        >
                          <span className="text-xs font-bold text-gray-800">{t.title}</span>
                          <span className="text-[10px] text-[#3B82F6] font-extrabold">Start Sprint →</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Matching Rooms */}
                  <div>
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Squad Arenas</h4>
                    {filteredSearchRooms.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No matching arenas</p>
                    ) : (
                      filteredSearchRooms.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsSearchModalOpen(false);
                            router.push(`/study?roomId=${r.id}`);
                          }}
                          className="p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between border border-gray-100 mb-1"
                        >
                          <span className="text-xs font-bold text-gray-800">{r.name}</span>
                          <span className="text-[10px] text-[#10B981] font-extrabold">Join Arena →</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: QUICK SPRINT & NOTE LAUNCHER (✎) ── */}
      {isQuickSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-gray-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] font-bold">edit</span>
                <h3 className="font-extrabold text-base text-gray-900">
                  Quick Focus Sprint Launcher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSprintModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartQuickSprint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sprint Note / Objective Title</label>
                <input
                  type="text"
                  required
                  value={quickSprintTitle}
                  onChange={(e) => setQuickSprintTitle(e.target.value)}
                  placeholder="e.g. Deep Focus Math Problem Set"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setQuickSprintDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quickSprintDuration === mins
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSprintModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3B82F6] hover:bg-blue-600 text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md"
                >
                  Launch Sprint 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
