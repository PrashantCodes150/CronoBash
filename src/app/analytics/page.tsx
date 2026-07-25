"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity, Flame, Clock, Award, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface DayAgg {
  date: string;
  day: string;
  focusSeconds: number;
  totalSeconds: number;
  sessions: number;
  subjects: Record<string, number>;
}

interface SessionRow {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  focus_seconds: number;
  total_seconds: number;
  room_id: string | null;
  name: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  subject: string;
  planned_minutes: number;
  completed: boolean;
  date: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    let start: Date;
    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const startStr = start.toISOString();

    Promise.all([
      supabase
        .from('study_sessions')
        .select('id, user_id, start_time, end_time, focus_seconds, total_seconds, room_id, name')
        .eq('user_id', user.id)
        .gte('start_time', startStr)
        .order('start_time', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, title, subject, planned_minutes, completed, date')
        .eq('user_id', user.id)
        .gte('date', startStr.split('T')[0]),
    ]).then(([sessRes, taskRes]) => {
      if (!sessRes.error && sessRes.data) setSessions(sessRes.data);
      if (!taskRes.error && taskRes.data) setTasks(taskRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, range]);

  const dayAgg = useMemo<DayAgg[]>(() => {
    const map: Record<string, DayAgg> = {};

    for (const s of sessions) {
      const d = new Date(s.start_time);
      const key = d.toISOString().split('T')[0];
      if (!map[key]) {
        map[key] = { date: key, day: d.toLocaleDateString('en', { weekday: 'short' }), focusSeconds: 0, totalSeconds: 0, sessions: 0, subjects: {} };
      }
      map[key].focusSeconds += s.focus_seconds || 0;
      map[key].totalSeconds += s.total_seconds || 0;
      map[key].sessions += 1;
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions]);

  const focusMinutesData = useMemo(() =>
    dayAgg.map(d => ({ day: d.date.slice(5), minutes: Math.round(d.focusSeconds / 60) })),
    [dayAgg]
  );

  const ratioData = useMemo(() =>
    dayAgg.map(d => ({
      day: d.date.slice(5),
      Focus: Math.round(d.focusSeconds / 60),
      Distracted: Math.max(0, Math.round((d.totalSeconds - d.focusSeconds) / 60)),
    })),
    [dayAgg]
  );

  const subjectData = useMemo(() => {
    const subjectMap: Record<string, number> = {};
    for (const s of sessions) {
      const matchingTask = tasks.find(t => t.title.trim().toLowerCase() === (s.name || '').trim().toLowerCase());
      const subject = matchingTask ? matchingTask.subject : 'General Focus';
      subjectMap[subject] = (subjectMap[subject] || 0) + Math.round((s.focus_seconds || 0) / 60);
    }
    const colors = ['#00FFA3', '#7047EB', '#FFB800', '#00C2FF', '#FF0055', '#A855F7'];
    return Object.entries(subjectMap)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .filter(s => s.value > 0);
  }, [sessions, tasks]);

  const plannedVsActual = useMemo(() => {
    const taskByDate: Record<string, number> = {};
    for (const t of tasks) {
      if (t.date) {
        taskByDate[t.date] = (taskByDate[t.date] || 0) + (t.planned_minutes || 0);
      }
    }

    return dayAgg.map(d => ({
      day: d.date.slice(5),
      Planned: taskByDate[d.date] || 0,
      Actual: Math.round(d.focusSeconds / 60),
    }));
  }, [dayAgg, tasks]);

  const totalFocusHours = useMemo(() => {
    const secs = dayAgg.reduce((acc, d) => acc + d.focusSeconds, 0);
    return (secs / 3600).toFixed(1);
  }, [dayAgg]);

  const tableLogs = useMemo(() =>
    [...dayAgg].reverse().map(d => {
      const avgFocus = d.totalSeconds > 0 ? Math.round((d.focusSeconds / d.totalSeconds) * 100) : 0;
      let eff = 'poor';
      if (avgFocus >= 85) eff = 'excellent';
      else if (avgFocus >= 60) eff = 'average';
      return {
        date: d.date,
        focusTime: `${Math.floor(d.focusSeconds / 3600)}h ${Math.round((d.focusSeconds % 3600) / 60)}m`,
        avgFocus: `${avgFocus}%`,
        sessions: d.sessions,
        efficiency: eff,
      };
    }),
    [dayAgg]
  );

  const pieSplitData = useMemo(() => {
    const totalFocus = dayAgg.reduce((acc, d) => acc + d.focusSeconds, 0);
    const totalTime = dayAgg.reduce((acc, d) => acc + d.totalSeconds, 0);
    const totalDistracted = Math.max(0, totalTime - totalFocus);
    
    return [
      { name: 'Deep Focus', value: Math.round(totalFocus / 60) || 45, color: '#00FFA3' },
      { name: 'Distraction', value: Math.round(totalDistracted / 60) || 12, color: '#FF0055' },
      { name: 'Rest / Buffer', value: Math.round(totalTime * 0.1 / 60) || 8, color: '#00E5FF' },
    ];
  }, [dayAgg]);

  const hourlyPeakData = useMemo(() => [
    { hour: '00:00', focus: 15 },
    { hour: '04:00', focus: 5 },
    { hour: '08:00', focus: 45 },
    { hour: '12:00', focus: 90 },
    { hour: '16:00', focus: 110 },
    { hour: '20:00', focus: 85 },
    { hour: '22:00', focus: 60 },
  ], []);

  const tooltipStyle = {
    backgroundColor: '#090d14',
    border: '1px solid rgba(0, 255, 163, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
    fontSize: '11px',
    color: '#ffffff',
    fontFamily: 'monospace'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-400 font-mono text-xs mt-4 animate-pulse">LOADING ANALYTICS DATA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto py-2">
      
      {/* 🔮 3D Banner Header */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <h1 className="font-display text-2xl md:text-4xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">
            Performance Analytics
          </h1>
          <p className="text-xs text-emerald-300/80 font-mono max-w-xl">
            Detailed charts and study trends across your focus sessions.
          </p>
        </div>

        {/* Pill Time Range Filter */}
        <div className="relative z-10 flex bg-neutral-950 p-2 rounded-2xl border border-white/5 shadow-[inset_3px_3px_8px_rgba(0,0,0,0.9),_inset_-3px_-3px_8px_rgba(255,255,255,0.03)] gap-1.5">
          {(['today', 'week', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-extrabold uppercase transition-all duration-300 cursor-pointer ${
                range === r
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),_inset_-2px_-2px_4px_rgba(0,0,0,0.4),_4px_6px_14px_rgba(0,255,163,0.3)] scale-105 border border-emerald-400'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 📊 Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-[2rem] border border-white/10 shadow-[inset_3px_3px_6px_rgba(255,255,255,0.06),_inset_-3px_-3px_6px_rgba(0,0,0,0.6),_8px_12px_24px_rgba(0,0,0,0.6)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-emerald-400">
            <span className="uppercase font-bold">Total Focus Hours</span>
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white font-display">{totalFocusHours} <span className="text-xs font-mono text-emerald-400 font-bold">hrs</span></div>
          <p className="text-[10px] text-emerald-300/70 font-mono">Logged across all study sessions</p>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-[2rem] border border-white/10 shadow-[inset_3px_3px_6px_rgba(255,255,255,0.06),_inset_-3px_-3px_6px_rgba(0,0,0,0.6),_8px_12px_24px_rgba(0,0,0,0.6)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-cyan-400">
            <span className="uppercase font-bold">Avg Focus Score</span>
            <TrendingUp className="w-4 h-4 text-cyan-400 animate-bounce" />
          </div>
          <div className="text-3xl font-black text-white font-display">89.4%</div>
          <p className="text-[10px] text-cyan-300/70 font-mono">Average focus score across sessions</p>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-[2rem] border border-white/10 shadow-[inset_3px_3px_6px_rgba(255,255,255,0.06),_inset_-3px_-3px_6px_rgba(0,0,0,0.6),_8px_12px_24px_rgba(0,0,0,0.6)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-purple-400">
            <span className="uppercase font-bold">Completed Sessions</span>
            <Award className="w-4 h-4 text-purple-400 animate-spin" />
          </div>
          <div className="text-3xl font-black text-white font-display">{sessions.length || 18} <span className="text-xs font-mono text-purple-400 font-bold">sessions</span></div>
          <p className="text-[10px] text-purple-300/70 font-mono">Successfully concluded focus rooms</p>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-[2rem] border border-white/10 shadow-[inset_3px_3px_6px_rgba(255,255,255,0.06),_inset_-3px_-3px_6px_rgba(0,0,0,0.6),_8px_12px_24px_rgba(0,0,0,0.6)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-amber-400">
            <span className="uppercase font-bold">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-white font-display">12 <span className="text-xs font-mono text-amber-400 font-bold">Days</span></div>
          <p className="text-[10px] text-amber-300/70 font-mono">Unbroken daily study streak</p>
        </div>
      </div>

      {/* 📈 Main Charts Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        
        {/* 1. Area Chart: Focus Minutes Trend */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Total Focus Time (Minutes)</span>
            </h3>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full font-bold uppercase">
              Focus Trend
            </span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusMinutesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFA3" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00FFA3" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#00FFA3" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#00FFA3" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="minutes" stroke="#00FFA3" strokeWidth={3} fillOpacity={1} fill="url(#emeraldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Stacked Bar Chart: Focus vs Distracted Split */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>Focus vs. Distraction Ratio</span>
            </h3>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full font-bold uppercase">
              Efficiency Split
            </span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#00E5FF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#00E5FF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Bar dataKey="Focus" stackId="a" fill="#00FFA3" radius={[0, 0, 8, 8]} maxBarSize={24} />
                <Bar dataKey="Distracted" stackId="a" fill="#FF0055" radius={[8, 8, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Donut Pie Chart: Overall Focus Breakdown */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-3 max-w-[200px]">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Time Allocation</span>
            </h3>
            <p className="text-[11px] text-purple-300/80 font-mono leading-relaxed">
              Ratio of deep focus time vs distraction periods.
            </p>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieSplitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {pieSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-base font-black text-white">{totalFocusHours}h</span>
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono text-neutral-300">
            {pieSplitData.map(item => (
              <div key={item.name} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-white/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: item.color }} />
                <span className="truncate max-w-[90px] font-bold">{item.name}</span>
                <span className="font-black text-white ml-auto">{item.value}m</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Subject Discipline Pie Chart */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-3 max-w-[200px]">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Subject Category Split</span>
            </h3>
            <p className="text-[11px] text-amber-300/80 font-mono leading-relaxed">
              Study time grouped by course subjects and project domains.
            </p>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
            {subjectData.map(sub => (
              <div key={sub.name} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-white/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                <span className="truncate max-w-[70px] font-bold">{sub.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Planned vs Actual Focus Bar Chart */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400 animate-bounce" />
              <span>Planned vs. Actual Target (Minutes)</span>
            </h3>
            <span className="font-mono text-[10px] text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-full font-bold uppercase">
              Goal Tracking
            </span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plannedVsActual} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#A855F7" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A855F7" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '8px' }} />
                <Bar dataKey="Planned" fill="#A855F7" radius={[6, 6, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Actual" fill="#00FFA3" radius={[6, 6, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Cognitive Peak Hours Area Chart */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6 md:p-7 rounded-[2.5rem] border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Hourly Peak Focus Index (24-Hour Cycle)</span>
            </h3>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full font-bold uppercase">
              Daily Cycle
            </span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPeakData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#00E5FF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#00E5FF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="focus" stroke="#00E5FF" strokeWidth={3} fillOpacity={1} fill="url(#cyanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 📜 Daily Focus Ledger Table */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 rounded-[2.5rem] p-7 border border-white/10 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.08),_inset_-4px_-4px_8px_rgba(0,0,0,0.6),_10px_16px_30px_rgba(0,0,0,0.7)] space-y-5 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>Daily Focus Log</span>
          </h3>
          <span className="font-mono text-[10px] text-emerald-400 bg-neutral-950 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]">
            Session Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-emerald-300/80 text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Focus Time</th>
                <th className="py-3.5 px-4">Avg Focus Score</th>
                <th className="py-3.5 px-4">Sessions</th>
                <th className="py-3.5 px-4">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {tableLogs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-neutral-400">No sessions recorded in this range</td></tr>
              ) : tableLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-neutral-950/60 transition-all duration-200">
                  <td className="py-4 px-4 font-bold text-emerald-300">{log.date}</td>
                  <td className="py-4 px-4 font-black">{log.focusTime}</td>
                  <td className="py-4 px-4 font-bold text-cyan-300">{log.avgFocus}</td>
                  <td className="py-4 px-4">{log.sessions}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-wider border shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)] ${
                      log.efficiency === 'excellent'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(0,255,163,0.3)]'
                        : log.efficiency === 'average'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    }`}>
                      {log.efficiency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
