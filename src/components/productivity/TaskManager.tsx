"use client";

import React, { useState, useEffect } from 'react';
import { TaskItem, useProductivityStore } from '@/lib/productivity-store';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Filter, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function TaskManager() {
  const { tasks, addTask, toggleTask, updateTaskStatus, deleteTask } = useProductivityStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Real Functional Toggles (Persisted in LocalStorage)
  const [autoArchive, setAutoArchive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('task_auto_archive') !== 'false';
    }
    return true;
  });

  const [highPriorityAlerts, setHighPriorityAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('task_priority_alerts') !== 'false';
    }
    return true;
  });

  const handleToggleAutoArchive = () => {
    const nextVal = !autoArchive;
    setAutoArchive(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('task_auto_archive', String(nextVal));
    }
    toast.success(nextVal ? 'Auto-Archive enabled: Completed tasks archived.' : 'Auto-Archive disabled: Showing all completed tasks.');
  };

  const handleToggleHighPriorityAlerts = () => {
    const nextVal = !highPriorityAlerts;
    setHighPriorityAlerts(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('task_priority_alerts', String(nextVal));
    }
    toast.success(nextVal ? 'High Priority Alerts active.' : 'Priority alerts muted.');
  };

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Engineering');
  const [plannedMinutes, setPlannedMinutes] = useState(45);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      subject,
      planned_minutes: plannedMinutes,
      completed: false,
      status: 'todo',
      priority,
      due_date: dueDate,
    });
    setTitle('');
    setIsModalOpen(false);
    toast.success('Task objective created! 🎯');
  };

  const filteredTasks = tasks.filter(t => {
    if (filterSubject !== 'all' && t.subject !== filterSubject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // Filter tasks based on autoArchive setting
  const todoTasks = filteredTasks.filter(t => t.status === 'todo' || (!t.status && !t.completed));
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = autoArchive
    ? filteredTasks.filter(t => (t.status === 'completed' || t.completed)).slice(0, 3) // Show max 3 if archived
    : filteredTasks.filter(t => t.status === 'completed' || t.completed);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed || t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const subjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'high':
        return (
          <span className={`bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${highPriorityAlerts ? 'animate-pulse' : ''}`}>
            {highPriorityAlerts && <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>}
            High
          </span>
        );
      case 'medium':
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Med</span>;
      case 'low':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAB308] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Completed Tasks</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{completedCount} of {totalTasks}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">pending_actions</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Pending Objectives</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{todoTasks.length} Pending</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">bolt</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Sprints</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{inProgressTasks.length} In Progress</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">trending_up</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Completion Rate</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{progressPercent}%</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── REAL FUNCTIONAL BLACK PILL TOGGLE SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">archive</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Auto-Archive Completed</span>
            <button
              onClick={handleToggleAutoArchive}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoArchive ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoArchive ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">notifications_active</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">High Priority Alerts</span>
            <button
              onClick={handleToggleHighPriorityAlerts}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                highPriorityAlerts ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${highPriorityAlerts ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Objective</span>
        </button>
      </div>

      {/* ── KANBAN COLUMNS WORKSPACE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: To Do */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">To Do</h3>
            </div>
            <span className="text-xs font-extrabold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-3 p-0.5">
            {todoTasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No pending tasks</p>
            ) : (
              todoTasks.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 hover:border-[#3B82F6] transition-all">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-extrabold text-slate-900">{t.title}</h4>
                    {getPriorityBadge(t.priority)}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="bg-blue-50 text-[#3B82F6] px-2 py-0.5 rounded-md border border-blue-100">#{t.subject}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {t.planned_minutes}m</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <button
                      onClick={() => updateTaskStatus(t.id, 'in_progress')}
                      className="text-[10px] font-extrabold bg-blue-50 text-[#3B82F6] hover:bg-blue-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Start Sprint →
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-[#3B82F6] animate-ping shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">In Progress</h3>
            </div>
            <span className="text-xs font-extrabold bg-blue-50 text-[#3B82F6] px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-3 p-0.5">
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No active sprints</p>
            ) : (
              inProgressTasks.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 hover:border-[#3B82F6] transition-all">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-extrabold text-slate-900">{t.title}</h4>
                    {getPriorityBadge(t.priority)}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="bg-blue-50 text-[#3B82F6] px-2 py-0.5 rounded-md border border-blue-100">#{t.subject}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {t.planned_minutes}m</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <button
                      onClick={() => updateTaskStatus(t.id, 'completed')}
                      className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0"></span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                {autoArchive ? 'Completed (Archived)' : 'Completed All'}
              </h3>
            </div>
            <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3 p-0.5">
            {completedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No completed items</p>
            ) : (
              completedTasks.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 opacity-75">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-extrabold text-slate-700 line-through">{t.title}</h4>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>

                  <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 font-bold">
                    <span>#{t.subject}</span>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
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
              <h3 className="font-extrabold text-base text-slate-900">Add New Objective</h3>
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
                  placeholder="e.g. Complete Chemistry Organic Reactions"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Tag</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Math, Physics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Planned Sprint (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={plannedMinutes}
                    onChange={e => setPlannedMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Add Objective 🎯</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
