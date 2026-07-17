"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase, Task, Timetable } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TasksPage() {
  const { user } = useAuth();

  // Tasks CRUD state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Engineering');
  const [newPlanned, setNewPlanned] = useState(45);

  // Timetables state
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [addDay, setAddDay] = useState(1); // Monday
  const [addStart, setAddStart] = useState('09:00');
  const [addEnd, setAddEnd] = useState('11:00');
  const [addSubject, setAddSubject] = useState('Code Review');

  const [loading, setLoading] = useState(true);

  // Charts mapping planned vs actual minutes
  const [chartData, setChartData] = useState<any[]>([]);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch metrics
  const loadTasksAndTimetable = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Tasks
      const { data: taskList } = await supabase
        .from('tasks')
        .select('*')
        .order('completed', { ascending: true });
      if (taskList) setTasks(taskList as Task[]);

      // 2. Fetch Weekly Timetable
      const { data: list } = await supabase
        .from('timetables')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      if (list) setTimetables(list as Timetable[]);

      // 3. Try to fetch weekly stats via SQL RPC function
      const { data: weeklyStats, error: rpcError } = await supabase
        .rpc('get_user_weekly_stats', { p_user_id: user.id });

      if (!rpcError && weeklyStats) {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formatted = weeklyStats.map((row: any) => {
          const dateObj = new Date(row.day);
          const dayName = daysOfWeek[dateObj.getDay()];
          return {
            day: dayName,
            Planned: 120, // Baseline target minutes
            Actual: Math.round(row.focus_seconds / 60)
          };
        });
        setChartData(formatted);
      } else {
        // Fallback: query study_sessions directly for this week
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

        setChartData(
          Object.entries(dailyMinutes).map(([day, Actual]) => ({ day, Planned: 120, Actual }))
        );
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Tasks
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          subject: newSubject,
          planned_minutes: newPlanned,
          completed: false
        })
        .select()
        .single();

      if (!error && data) {
        setTasks([...tasks, data as Task]);
        setNewTitle('');
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

  // CRUD Timetable
  const handleAddTimetableBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('timetables')
        .insert({
          user_id: user.id,
          day_of_week: addDay,
          start_time: `${addStart}:00`,
          end_time: `${addEnd}:00`,
          subject: addSubject
        })
        .select()
        .single();

      if (!error && data) {
        setTimetables([...timetables, data as Timetable].sort((a, b) => a.day_of_week - b.day_of_week));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTimetableBlock = async (id: string) => {
    try {
      const { error } = await supabase.from('timetables').delete().eq('id', id);
      if (!error) {
        setTimetables(timetables.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadTasksAndTimetable();
    }
  }, [user]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">FETCHING OBJECTIVES LEDGER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Sprints & Schedules</h2>
        <p className="text-xs text-on-surface-variant mt-1">Manage sprint objectives, scheduled cohorts blocks, and analytics charts</p>
      </header>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tasks Objectives & Weekly Timetable */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Timetable blocks grid */}
          <section className="glass-panel rounded-xl p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Weekly Schedule Blocks</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekdays.map((dayName, idx) => {
                const dayBlocks = timetables.filter(t => t.day_of_week === idx);
                return (
                  <div key={dayName} className="bg-surface-container-low/40 border border-outline-variant/50 rounded-lg p-3 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <h4 className="font-label-mono text-[9px] uppercase tracking-widest text-primary-fixed font-bold border-b border-outline-variant/30 pb-1.5 mb-2">
                        {dayName.slice(0, 3)}
                      </h4>
                      
                      {dayBlocks.length === 0 ? (
                        <p className="text-[8px] text-on-surface-variant font-mono mt-2 uppercase">Rest Day</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayBlocks.map(block => (
                            <div key={block.id} className="bg-secondary-container/10 border border-secondary/30 p-1.5 rounded relative group">
                              <button 
                                onClick={() => handleDeleteTimetableBlock(block.id)}
                                className="absolute -top-1 -right-1 hidden group-hover:flex bg-error hover:bg-red-600 text-white rounded-full w-3.5 h-3.5 items-center justify-center text-[8px] border border-outline-variant/50 cursor-pointer"
                              >
                                ×
                              </button>
                              <p className="text-[9px] font-mono text-on-surface font-bold truncate">{block.subject}</p>
                              <span className="text-[7px] font-mono text-on-surface-variant uppercase tracking-widest block">
                                {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Planned vs Actual Recharts */}
          <section className="card-base p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Efficiency Index (Planned vs Actual)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#849588" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#849588" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '8px' }}
                    labelStyle={{ color: '#dfe2f1', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                    itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="Planned" fill="#7047EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Actual" fill="#00FFA3" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Side: Sprint objectives list */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Objectives Manager */}
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Objectives list</h3>
            
            <form onSubmit={handleAddTask} className="space-y-3 bg-surface p-4 rounded-xl border border-outline-variant/50">
              <div>
                <label className="block font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">New Goal</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solve Math Assignment"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-2 py-2 text-xs text-on-surface focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Mathematics">Math</option>
                    <option value="Physics">Physics</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-1 font-bold">Target (Mins)</label>
                  <input
                    type="number"
                    min={10}
                    value={newPlanned}
                    onChange={(e) => setNewPlanned(parseInt(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-2 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-container text-on-primary font-label-mono text-[10px] font-bold py-2 rounded-lg hover:bg-primary-fixed transition-colors mt-2 cursor-pointer"
              >
                Add Objective
              </button>
            </form>

            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className={`p-3 bg-surface-container-low/80 border border-outline-variant/30 rounded-lg flex items-center justify-between gap-3 ${
                    task.completed ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="w-3.5 h-3.5 rounded border-outline-variant bg-background text-primary-container focus:ring-primary-container cursor-pointer"
                    />
                    <div>
                      <p className={`font-mono text-xs text-on-surface ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                      <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold mt-1 inline-block">
                        #{task.subject} • {task.planned_minutes}m target
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-on-surface-variant hover:text-error p-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Timetable schedule config */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Configure Schedule Block</h3>
            
            <form onSubmit={handleAddTimetableBlock} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">Weekday</label>
                <select
                  value={addDay}
                  onChange={(e) => setAddDay(parseInt(e.target.value))}
                  className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none focus:border-primary-fixed"
                >
                  {weekdays.map((day, dIdx) => (
                    <option key={day} value={dIdx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={addStart}
                    onChange={(e) => setAddStart(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={addEnd}
                    onChange={(e) => setAddEnd(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">Block Target Tag</label>
                <input
                  type="text"
                  required
                  value={addSubject}
                  onChange={(e) => setAddSubject(e.target.value)}
                  placeholder="e.g. Physics Mechanical"
                  className="w-full bg-background border border-outline-variant rounded-lg p-2 text-xs focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-container text-on-primary font-bold p-2.5 rounded-lg hover:bg-primary-fixed transition-colors mt-2 cursor-pointer"
              >
                Schedule Block
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
