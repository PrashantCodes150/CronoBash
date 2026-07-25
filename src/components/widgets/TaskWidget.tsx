"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { CheckCircle2, Circle, Plus, ArrowRight, ListTodo } from 'lucide-react';
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
    <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4 shadow-lg flex flex-col justify-between h-full hover:border-primary/40 transition">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-fixed">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Task Manager</h3>
              <p className="text-[11px] text-on-surface-variant font-mono">{pendingTasks.length} pending tasks</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=tasks"
            className="text-xs text-primary-fixed hover:text-white font-mono flex items-center gap-1 transition"
          >
            Open Hub <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
            <span>Daily Completion</span>
            <span className="text-primary-fixed font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-primary-fixed transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Add Input */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add quick task..."
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            className="flex-1 bg-surface-variant border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded-xl text-xs hover:brightness-110 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Task List Preview */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {pendingTasks.length === 0 ? (
            <div className="text-xs text-center text-emerald-400 font-mono italic py-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              🎉 All tasks completed for today!
            </div>
          ) : (
            pendingTasks.slice(0, 4).map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 bg-surface-container-high/60 hover:bg-surface-container-high rounded-xl border border-outline-variant/30 text-xs transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="text-on-surface-variant hover:text-emerald-400 transition"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <span className="text-white font-medium truncate">{t.title}</span>
                </div>
                <span className="text-[10px] font-mono bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant shrink-0">
                  {t.planned_minutes}m
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
