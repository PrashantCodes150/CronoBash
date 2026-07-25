"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TaskManager } from '@/components/productivity/TaskManager';
import { CalendarView } from '@/components/productivity/CalendarView';
import { TimeTrackerView } from '@/components/productivity/TimeTrackerView';
import { NoteTakerView } from '@/components/productivity/NoteTakerView';
import { ListTodo, Calendar, Timer, FileText, Sparkles } from 'lucide-react';

function ProductivityHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'tracker' | 'notes'>('tasks');

  useEffect(() => {
    if (tabParam && ['tasks', 'calendar', 'tracker', 'notes'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'tasks' | 'calendar' | 'tracker' | 'notes') => {
    setActiveTab(tab);
    router.push(`/tasks?tab=${tab}`);
  };

  const tabs = [
    { id: 'tasks', name: 'Task Manager', icon: ListTodo, color: 'text-primary-fixed' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-amber-400' },
    { id: 'tracker', name: 'Time Tracker', icon: Timer, color: 'text-emerald-400' },
    { id: 'notes', name: 'Note Taker', icon: FileText, color: 'text-purple-400' },
  ] as const;

  return (
    <div className="min-h-screen bg-surface text-on-surface p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 border border-primary/20 text-primary-fixed px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Productivity Suite
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight mt-2">
            Productivity Hub
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage your daily task workflow, schedule exams on calendar, track deep focus sessions, and organize notes.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center bg-surface-container-high p-1.5 rounded-2xl border border-outline-variant/40 shadow-inner gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(0,255,163,0.25)] scale-[1.02]'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-variant'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-on-primary' : tab.color}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'tracker' && <TimeTrackerView />}
        {activeTab === 'notes' && <NoteTakerView />}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-primary-fixed font-mono text-sm">
        Loading Productivity Hub...
      </div>
    }>
      <ProductivityHubContent />
    </Suspense>
  );
}
