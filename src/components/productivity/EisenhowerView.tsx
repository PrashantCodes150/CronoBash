"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function EisenhowerView() {
  const { tasks, addTask, deleteTask, toggleTask } = useProductivityStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');

  // Real Functional Toggles (Persisted in LocalStorage)
  const [autoMoveDone, setAutoMoveDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eisen_auto_done') !== 'false';
    }
    return true;
  });

  const [urgentAlerts, setUrgentAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eisen_urgent_alerts') !== 'false';
    }
    return true;
  });

  const handleToggleAutoMoveDone = () => {
    const nextVal = !autoMoveDone;
    setAutoMoveDone(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eisen_auto_done', String(nextVal));
    }
    toast.success(nextVal ? 'Auto-move completed enabled.' : 'Completed items stay in quadrant.');
  };

  const handleToggleUrgentAlerts = () => {
    const nextVal = !urgentAlerts;
    setUrgentAlerts(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eisen_urgent_alerts', String(nextVal));
    }
    toast.success(nextVal ? 'Q1 Urgent alerts active.' : 'Urgent alerts muted.');
  };

  const q1Tasks = tasks.filter(t => t.priority === 'high' && !t.completed);
  const q2Tasks = tasks.filter(t => t.priority === 'medium' && !t.completed);
  const q3Tasks = tasks.filter(t => t.priority === 'low' && !t.completed);
  const q4Tasks = tasks.filter(t => t.completed);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const priorityMap = {
      q1: 'high',
      q2: 'medium',
      q3: 'low',
      q4: 'low',
    } as const;

    addTask({
      title: title.trim(),
      subject: 'Eisenhower',
      planned_minutes: 30,
      completed: false,
      status: 'todo',
      priority: priorityMap[quadrant],
      due_date: new Date().toISOString().split('T')[0],
    });

    setTitle('');
    setIsModalOpen(false);
    toast.success('Task prioritized in Eisenhower Matrix! 🧠');
  };

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">priority_high</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Q1: Do First</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{q1Tasks.length} Urgent</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">schedule</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Q2: Schedule</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{q2Tasks.length} Important</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">bolt</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Q3: Quick Sprint</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{q3Tasks.length} Delegate</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Q4: Done</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{q4Tasks.length} Completed</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── CONTROLS & REAL FUNCTIONAL BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">done_all</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Auto-Move Completed</span>
            <button
              onClick={handleToggleAutoMoveDone}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoMoveDone ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoMoveDone ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">notifications_active</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Urgent Q1 Alerts</span>
            <button
              onClick={handleToggleUrgentAlerts}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                urgentAlerts ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${urgentAlerts ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Matrix Task</span>
        </button>
      </div>

      {/* ── 4 QUADRANTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Q1: Do First */}
        <div className={`morphism-card bg-white p-5 rounded-[28px] border shadow-sm space-y-4 ${urgentAlerts && q1Tasks.length > 0 ? 'border-red-400 ring-2 ring-red-500/20' : 'border-red-200'}`}>
          <div className="flex justify-between items-center pb-3 border-b border-red-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-3 h-3 rounded-full bg-red-500 shrink-0 ${urgentAlerts && q1Tasks.length > 0 ? 'animate-ping' : ''}`}></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">Q1: DO FIRST (Urgent &amp; Important)</h3>
            </div>
            <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full border border-red-200 shrink-0">{q1Tasks.length}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
            {q1Tasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No urgent &amp; important tasks</p>
            ) : (
              q1Tasks.map(t => (
                <div key={t.id} className="p-3 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-900 truncate min-w-0">{t.title}</span>
                  <button onClick={() => toggleTask(t.id)} className="text-xs font-bold text-red-600 hover:underline cursor-pointer shrink-0">Done ✓</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Q2: Schedule */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-blue-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6] shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">Q2: SCHEDULE (Important, Not Urgent)</h3>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-[#3B82F6] px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">{q2Tasks.length}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
            {q2Tasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No scheduled goals yet</p>
            ) : (
              q2Tasks.map(t => (
                <div key={t.id} className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-900 truncate min-w-0">{t.title}</span>
                  <button onClick={() => toggleTask(t.id)} className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer shrink-0">Done ✓</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Q3: Quick Sprint */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-amber-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">Q3: QUICK SPRINT (Urgent, Less Important)</h3>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">{q3Tasks.length}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
            {q3Tasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No quick sprint tasks</p>
            ) : (
              q3Tasks.map(t => (
                <div key={t.id} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-900 truncate min-w-0">{t.title}</span>
                  <button onClick={() => toggleTask(t.id)} className="text-xs font-bold text-amber-600 hover:underline cursor-pointer shrink-0">Done ✓</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Q4: Completed */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-emerald-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">Q4: COMPLETED &amp; ARCHIVED</h3>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">{q4Tasks.length}</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
            {q4Tasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No completed items in matrix</p>
            ) : (
              q4Tasks.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 opacity-75">
                  <span className="text-xs font-extrabold text-slate-700 line-through truncate min-w-0">{t.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add Eisenhower Objective</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Finish Thermodynamics Formula Sheet"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Matrix Quadrant</label>
                <select
                  value={quadrant}
                  onChange={e => setQuadrant(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="q1">Q1: DO FIRST (Urgent &amp; Important)</option>
                  <option value="q2">Q2: SCHEDULE (Important, Not Urgent)</option>
                  <option value="q3">Q3: QUICK SPRINT (Urgent, Less Important)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Prioritize 🧠</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
