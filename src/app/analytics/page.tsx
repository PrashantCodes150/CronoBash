"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

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
        .select('id, user_id, start_time, end_time, focus_seconds, total_seconds, room_id')
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
    for (const t of tasks) {
      if (t.completed) {
        subjectMap[t.subject] = (subjectMap[t.subject] || 0) + (t.planned_minutes || 0);
      }
    }
    const colors = ['#00FFA3', '#7047EB', '#FFB800', '#00C2FF', '#FF0055', '#A855F7'];
    return Object.entries(subjectMap)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .filter(s => s.value > 0);
  }, [tasks]);

  const plannedVsActual = useMemo(() => {
    const taskByDate: Record<string, number> = {};
    for (const t of tasks) {
      if (t.completed && t.date) {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">FETCHING TELEMETRY METRICS...</p>
      </div>
    );
  }

  const tooltipStyle = { backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '10px' };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-on-surface-variant mt-1">Deep analysis of focus multipliers, subjects splits, and timelines indices</p>
        </div>
        <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1 text-xs font-label-mono uppercase font-bold text-on-surface-variant">
          {(['today', 'week', 'month'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${range === r ? 'bg-primary-container text-on-primary' : 'hover:text-on-surface'}`}>
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base p-5 space-y-4">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Total focus time (Minutes)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusMinutesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="minutes" stroke="#00FFA3" strokeWidth={1.5} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5 space-y-4">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Focus vs Distracted split</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Focus" stackId="a" fill="#00FFA3" maxBarSize={20} />
                <Bar dataKey="Distracted" stackId="a" fill="#FF0055" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-5 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 max-w-[200px]">
            <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Subject Distribution</h3>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Completed tasks grouped by subject category.
            </p>
          </div>
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectData.length > 0 ? subjectData : [{ name: 'No data', value: 1, color: '#3a4a3f' }]}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {(subjectData.length > 0 ? subjectData : [{ name: 'No data', value: 1, color: '#3a4a3f' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-sm font-bold text-on-surface">{totalFocusHours}h</span>
              <span className="text-[7px] text-on-surface-variant font-bold uppercase tracking-widest">Total</span>
            </div>
          </div>
          {subjectData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-on-surface-variant">
              {subjectData.map(sub => (
                <span key={sub.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="truncate max-w-[70px]">{sub.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card-base p-5 space-y-4">
          <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Planned vs Actual (Minutes)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plannedVsActual} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#849588" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Planned" fill="#7047EB" radius={[2, 2, 0, 0]} maxBarSize={15} />
                <Bar dataKey="Actual" fill="#00FFA3" radius={[2, 2, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="glass-panel rounded-xl overflow-hidden p-6 space-y-4">
        <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Daily focus ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Focus Time</th>
                <th className="py-3 px-4">Avg Focus</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {tableLogs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-on-surface-variant">No sessions recorded in this range</td></tr>
              ) : tableLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold">{log.date}</td>
                  <td className="py-3.5 px-4">{log.focusTime}</td>
                  <td className="py-3.5 px-4">{log.avgFocus}</td>
                  <td className="py-3.5 px-4">{log.sessions}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                      log.efficiency === 'excellent'
                        ? 'bg-primary-container/10 border-primary-container text-primary-fixed'
                        : log.efficiency === 'average'
                        ? 'bg-secondary-container/15 border-secondary-container text-secondary-fixed'
                        : 'bg-error-container/15 border-error text-error'
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
