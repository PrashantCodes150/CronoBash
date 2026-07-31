"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskManager } from '@/components/productivity/TaskManager';
import { CalendarView } from '@/components/productivity/CalendarView';
import { TimeTrackerView } from '@/components/productivity/TimeTrackerView';
import { NoteTakerView } from '@/components/productivity/NoteTakerView';
import { EisenhowerView } from '@/components/productivity/EisenhowerView';
import { FeynmanFlashcardView } from '@/components/productivity/FeynmanFlashcardView';
import { SpacedRepetitionView } from '@/components/productivity/SpacedRepetitionView';
import { AmbientFocusSynthView } from '@/components/productivity/AmbientFocusSynthView';
import { useProductivityStore } from '@/lib/productivity-store';
import { toast } from 'react-hot-toast';

function ProductivityHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  // Store data for top category widgets
  const { tasks, events, sessions, notes } = useProductivityStore();

  useEffect(() => {
    if (tabParam && ['tasks', 'calendar', 'tracker', 'notes', 'eisenhower', 'feynman', 'spaced', 'synth'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(null); // Main Directory Hub Mode
    }
  }, [tabParam]);

  const handleOpenTool = (toolId: string) => {
    setActiveTab(toolId);
    router.push(`/tasks?tab=${toolId}`);
  };

  const handleBackToHub = () => {
    setActiveTab(null);
    router.push('/tasks');
  };

  const completedTasksCount = tasks.filter(t => t.completed || t.status === 'completed').length;
  const totalFocusSecs = (sessions || []).reduce((acc: number, log: any) => acc + (log.duration_seconds || 0), 0);
  const focusHours = (totalFocusSecs / 3600).toFixed(1);

  const suiteCategories = [
    { 
      id: 'tasks', 
      name: 'Task Command Center', 
      subtitle: `${completedTasksCount} of ${tasks.length} Completed`, 
      desc: 'Kanban workflow, milestone progress bars, priority badges & sprint targets.',
      icon: 'check_circle', 
      bg: 'bg-[#EAB308]', 
      border: 'hover:border-amber-300' 
    },
    { 
      id: 'calendar', 
      name: 'Exams & Schedule', 
      subtitle: `${events.length} Exams Scheduled`, 
      desc: 'Interactive monthly exam calendar, study deadlines & event category tags.',
      icon: 'calendar_month', 
      bg: 'bg-[#3B82F6]', 
      border: 'hover:border-blue-300' 
    },
    { 
      id: 'tracker', 
      name: 'Time Tracker', 
      subtitle: `${focusHours} Hours Logged`, 
      desc: 'Digital stopwatch, Pomodoro presets (15m, 25m, 45m) & audio finish bells.',
      icon: 'timer', 
      bg: 'bg-[#9333EA]', 
      border: 'hover:border-purple-300' 
    },
    { 
      id: 'notes', 
      name: 'Markdown Notes', 
      subtitle: `${notes.length} Memos Saved`, 
      desc: 'Formula cheat sheets, algorithm notes, search filter & note pinning.',
      icon: 'description', 
      bg: 'bg-[#F97316]', 
      border: 'hover:border-orange-300' 
    },
    { 
      id: 'eisenhower', 
      name: 'Eisenhower Priority Matrix', 
      subtitle: '4-Quadrant Decision Engine', 
      desc: 'Science of decision making: Urgent vs Important 4-quadrant prioritization.',
      icon: 'grid_view', 
      bg: 'bg-[#10B981]', 
      border: 'hover:border-emerald-300' 
    },
    { 
      id: 'feynman', 
      name: 'Feynman Recall Studio', 
      subtitle: 'Active Flashcard Recall', 
      desc: 'Nobel laureate Feynman method: Explain complex terms simply with flashcards.',
      icon: 'style', 
      bg: 'bg-[#F43F5E]', 
      border: 'hover:border-rose-300' 
    },
    { 
      id: 'spaced', 
      name: 'Spaced Repetition', 
      subtitle: 'Ebbinghaus Memory Shield', 
      desc: 'Optimal 1d, 3d, 7d, 14d review schedules to prevent knowledge decay.',
      icon: 'update', 
      bg: 'bg-[#F59E0B]', 
      border: 'hover:border-amber-400' 
    },
    { 
      id: 'synth', 
      name: 'Binaural Beats Synth', 
      subtitle: 'Cognitive Sound Waves', 
      desc: 'Alpha (10Hz), Beta (18Hz), Theta (6Hz) & Pink noise audio entrainment.',
      icon: 'graphic_eq', 
      bg: 'bg-[#6366F1]', 
      border: 'hover:border-indigo-300' 
    },
  ] as const;

  // ── IF A SPECIFIC TOOL IS SELECTED, RENDER DEDICATED FULL PAGE VIEW ──
  if (activeTab) {
    const currentTool = suiteCategories.find(c => c.id === activeTab);
    return (
      <div className="bg-[#ECEFF6] min-h-screen text-slate-900 font-sans p-3 sm:p-5 md:p-6 rounded-[32px] space-y-6 w-full max-w-full select-none pb-24 lg:pb-8">
        
        {/* Sub-page Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToHub}
              className="bg-white hover:bg-slate-50 px-4 py-2.5 rounded-full border border-white/80 shadow-sm text-xs font-black text-slate-800 flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Suite Directory</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                className="bg-white px-4 py-2.5 rounded-full shadow-sm border border-white/80 flex items-center gap-2 cursor-pointer hover:shadow transition-all group"
              >
                <span className={`w-3 h-3 rounded-full ${currentTool?.bg}`}></span>
                <span className="font-black text-xs text-slate-900">{currentTool?.name}</span>
                <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform ${isNavDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {isNavDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNavDropdownOpen(false)}></div>
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-40 animate-fadeIn">
                    <ul className="space-y-1 pt-1 text-xs font-bold text-slate-700">
                      {suiteCategories.map(cat => (
                        <li key={cat.id}>
                          <button
                            onClick={() => { handleOpenTool(cat.id); setIsNavDropdownOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-900 cursor-pointer"
                          >
                            <span className={`w-3 h-3 rounded-full ${cat.bg}`}></span>
                            <span>{cat.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => router.push('/rooms')}
              className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">fit_screen</span>
              <span>Focus Arena</span>
            </button>
          </div>
        </div>

        {/* Dedicated Tool Page View with Smooth Framer Motion Page Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'tasks' && <TaskManager />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'tracker' && <TimeTrackerView />}
            {activeTab === 'notes' && <NoteTakerView />}
            {activeTab === 'eisenhower' && <EisenhowerView />}
            {activeTab === 'feynman' && <FeynmanFlashcardView />}
            {activeTab === 'spaced' && <SpacedRepetitionView />}
            {activeTab === 'synth' && <AmbientFocusSynthView />}
          </motion.div>
        </AnimatePresence>

      </div>
    );
  }

  // ── MAIN DIRECTORY HUB MODE (DISPLAYING ONLY THE 8 LARGE SCIENCE TOOL CARDS) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#ECEFF6] min-h-screen text-slate-900 font-sans p-3 sm:p-5 md:p-6 rounded-[32px] space-y-8 w-full max-w-full select-none pb-24 lg:pb-8"
    >
      
      {/* Directory Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-blue-50 border border-blue-200 text-[#3B82F6] px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            Science Productivity Suite
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Productivity Suite <span className="text-[#3B82F6]">Directory</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Select any of the 8 dedicated scientific productivity studios below to open its full workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/rooms')}
            className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-3 px-6 rounded-full transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">fit_screen</span>
            <span>Enter Focus Arena</span>
          </button>
        </div>
      </div>

      {/* 8 Large Dedicated Science Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {suiteCategories.map(cat => (
          <motion.div
            key={cat.id}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenTool(cat.id)}
            className={`morphism-card bg-white p-7 rounded-[32px] border border-white/80 shadow-sm space-y-4 flex flex-col justify-between cursor-pointer group transition-all ${cat.border}`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className={`w-14 h-14 rounded-full ${cat.bg} text-white flex items-center justify-center shadow-md font-bold`}>
                  <span className="material-symbols-outlined text-2xl font-bold">{cat.icon}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900 text-lg transition-colors">north_east</span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">{cat.name}</h3>
                <p className="text-xs font-extrabold text-[#3B82F6] mt-0.5">{cat.subtitle}</p>
                <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">{cat.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-700 group-hover:text-slate-900">
              <span>Open Studio Page</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold text-sm bg-[#ECEFF6]">
        Loading...
      </div>
    }>
      <ProductivityHubContent />
    </Suspense>
  );
}
