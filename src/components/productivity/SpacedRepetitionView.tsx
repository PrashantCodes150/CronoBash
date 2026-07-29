"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { RefreshCw, Plus, Trash2, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SpacedRepetitionView() {
  const { spacedTopics, addSpacedTopic, markTopicReviewed, deleteSpacedTopic } = useProductivityStore();

  // Real Functional Toggles (Persisted in LocalStorage)
  const [autoReminder, setAutoReminder] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spaced_auto_reminder') !== 'false';
    }
    return true;
  });

  const [ebbinghausCurveShield, setEbbinghausCurveShield] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spaced_ebbinghaus_shield') !== 'false';
    }
    return true;
  });

  const handleToggleAutoReminder = () => {
    const nextVal = !autoReminder;
    setAutoReminder(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spaced_auto_reminder', String(nextVal));
    }
    toast.success(nextVal ? 'Review Reminders active.' : 'Reminders muted.');
  };

  const handleToggleEbbinghausShield = () => {
    const nextVal = !ebbinghausCurveShield;
    setEbbinghausCurveShield(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spaced_ebbinghaus_shield', String(nextVal));
    }
    toast.success(nextVal ? 'Ebbinghaus Memory Retention Shield active.' : 'Memory Shield disabled.');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [subject, setSubject] = useState('Physics');

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    addSpacedTopic({
      topicName: topicName.trim(),
      subject: subject.trim() || 'General',
      lastReviewed: 'Just now',
      nextReviewDays: 1,
      retentionPercent: 100,
    });

    setTopicName('');
    setIsModalOpen(false);
    toast.success('Topic added to Spaced Repetition Schedule! 🔄');
  };

  const avgRetention = spacedTopics.length > 0
    ? Math.round(spacedTopics.reduce((acc, t) => acc + t.retentionPercent, 0) / spacedTopics.length)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">update</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Topics</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{spacedTopics.length} Review Schedules</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">psychology</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Avg Retention</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{avgRetention}% Retention</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">event_repeat</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Due Today</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{spacedTopics.filter(t => t.nextReviewDays === 1).length} Topics Due</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">shield</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Memory Shield</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{ebbinghausCurveShield ? 'Active' : 'Disabled'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── CONTROLS & REAL FUNCTIONAL BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">notifications_active</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Review Reminders</span>
            <button
              onClick={handleToggleAutoReminder}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoReminder ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoReminder ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">shield</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Memory Shield</span>
            <button
              onClick={handleToggleEbbinghausShield}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                ebbinghausCurveShield ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${ebbinghausCurveShield ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review Topic</span>
        </button>
      </div>

      {/* ── REVIEW TOPICS GRID ── */}
      {spacedTopics.length === 0 ? (
        <div className="morphism-card bg-white text-center py-16 space-y-3 rounded-[28px] border border-white/80">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No spaced review topics added yet</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#F59E0B] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">
            + Add First Review Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {spacedTopics.map(t => (
            <div key={t.id} className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold bg-blue-50 text-[#3B82F6] px-2.5 py-0.5 rounded-lg border border-blue-100 uppercase">
                    #{t.subject}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-400">Review in {t.nextReviewDays}d</span>
                    <button
                      onClick={() => deleteSpacedTopic(t.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 truncate">{t.topicName}</h4>
                <p className="text-[10px] text-slate-400 font-bold">Last reviewed: {t.lastReviewed}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Memory Retention</span>
                  <span className="text-[#10B981] font-black">{t.retentionPercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                    style={{ width: `${t.retentionPercent}%` }}
                  />
                </div>

                <button
                  onClick={() => markTopicReviewed(t.id)}
                  className="w-full mt-2 bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Mark Reviewed Today</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TOPIC MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add Spaced Review Topic</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={e => setTopicName(e.target.value)}
                  placeholder="e.g. Calculus Derivatives, Organic Reactions"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Math, Physics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Add Schedule 🔄</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
