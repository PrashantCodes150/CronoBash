"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Task, Room } from '@/lib/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, refreshWallet } = useAuth();

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

  // Charts states
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [hourlyChartData, setHourlyChartData] = useState<any[]>([]);

  // Fetch Dashboard metrics from Supabase
  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let focusSum = 0;
      let totalSum = 0;

      // 1. Fetch study sessions today for detail
      const { data: sessionsToday, error: sessError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${todayStr}T00:00:00Z`);

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

      // 5. Chart 1: Weekly Focus (Last 7 days) — real data from study_sessions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const weekStartStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('start_time, focus_seconds')
        .eq('user_id', user.id)
        .gte('start_time', `${weekStartStr}T00:00:00Z`);

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

      // 6. Chart 2: Hourly Focus (Today) — bucket by 2-hour windows
      const hourlyBuckets: Record<string, number> = {};
      for (let h = 8; h <= 22; h += 2) {
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

      // 7. Calculate streak: count consecutive days backwards with study sessions
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('start_time')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (allSessions) {
        const sessionDates = new Set<string>();
        for (const s of allSessions) {
          sessionDates.add(new Date(s.start_time).toISOString().split('T')[0]);
        }

        let streak = 0;
        const checkDate = new Date();
        // If no sessions today, start checking from yesterday
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
  const distractedMinsToday = Math.max(10, Math.round((totalSecondsToday - focusSecondsToday) / 60));
  const progressPercent = Math.min(100, Math.round((focusMinsToday / targetGoal) * 100));

  // Chart 3: Donut chart data
  const donutData = [
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
        <div className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl p-3 select-none">
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

      {/* Grid structure: Goal rings progress + quick stats cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Progress Circular Gauge */}
        <div className="lg:col-span-8 card-base p-6 bg-grid-pattern relative overflow-hidden group">
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

        {/* Right Column (4 cols): Quick stats cards */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-4">
          <div className="card-base p-4 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Current Streak</p>
                <p className="font-display text-lg font-black text-on-surface">{streakDays} Days</p>
              </div>
            </div>
            <span className="font-label-mono text-[10px] text-primary-fixed bg-primary-container/10 px-2 py-0.5 rounded-full font-bold">
              {streakDays > 0 ? 'Active' : 'Start today'}
            </span>
          </div>

          <div className="card-base p-4 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary-fixed">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Sessions Today</p>
                <p className="font-display text-lg font-black text-on-surface">{totalSessionsToday} Runs</p>
              </div>
            </div>
          </div>

          <div className="card-base p-4 flex items-center justify-between hover:border-primary-fixed-dim transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Average Focus</p>
                <p className="font-display text-lg font-black text-on-surface">{avgFocusPercent}%</p>
              </div>
            </div>
          </div>
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
              <div className="h-full flex items-center justify-center">
                <p className="text-[11px] text-on-surface-variant font-label-mono">No active focus tasks</p>
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
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-3.5 h-3.5 text-primary-container bg-background border-outline-variant rounded focus:ring-primary-container cursor-pointer"
                      />
                      <span className={`text-xs text-on-surface truncate ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Lobbies list (Joined Rooms) - 4 cols */}
        <div className="xl:col-span-4 card-base flex flex-col h-[360px] overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase">Joined Squads</h3>
            <span className="font-label-mono text-[10px] text-on-surface-variant">{liveRooms.length} active</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {liveRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-[11px] text-on-surface-variant font-label-mono">No active room memberships</p>
                <button 
                  onClick={() => router.push('/rooms')}
                  className="mt-3 bg-secondary-container text-on-secondary px-4 py-1.5 rounded font-label-mono text-[10px] font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
                >
                  Browse Lobbies
                </button>
              </div>
            ) : (
              liveRooms.map(room => (
                <div 
                  key={room.id}
                  className="p-3 bg-surface-container-lowest/60 border border-outline-variant/35 rounded-xl flex items-center justify-between gap-3 hover:border-secondary-fixed transition-all"
                >
                  <div className="min-w-0">
                    <h4 className="font-display text-xs font-bold text-on-surface truncate uppercase tracking-tight">{room.name}</h4>
                    <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest mt-1 inline-block font-bold">
                      #{room.type} • {room.max_members} max
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/rooms/${room.id}`)}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[9px] font-bold py-1.5 px-3.5 rounded transition-colors cursor-pointer"
                  >
                    Enter
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
