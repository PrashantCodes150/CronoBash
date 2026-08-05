"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { CheckCircle2, Circle, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function TaskWidget() {
  const { tasks, toggleTask, addTask } = useProductivityStore();
  const [quickTitle, setQuickTitle] = useState('');

  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed');
  const completedCount = tasks.filter(t => t.completed || t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      subject: 'General',
      planned_minutes: 30,
      completed: false,
      status: 'todo',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
    });
    setQuickTitle('');
  };

  return (
    <div className="morphism-card bg-white p-5 rounded-[24px] space-y-4 shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:border-[#3B82F6] transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Task Manager</h3>
              <p className="text-[11px] text-slate-500 font-medium">{pendingTasks.length} pending tasks</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=tasks"
            className="text-xs text-[#3B82F6] hover:underline font-bold flex items-center gap-1 transition"
          >
            Open Hub <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>Daily Completion</span>
            <span className="text-[#3B82F6] font-extrabold">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* List preview */}
        <div className="space-y-1.5 pt-1">
          {pendingTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">All tasks completed! 🎉</p>
            </div>
          ) : (
            pendingTasks.slice(0, 2).map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl cursor-pointer transition text-xs font-semibold text-slate-800"
              >
                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{t.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 pt-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add quick task..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
        />
        <button
          type="submit"
          className="bg-[#1D1D1F] hover:bg-black text-white p-2 rounded-xl transition text-xs flex items-center justify-center font-bold shadow-sm"
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
