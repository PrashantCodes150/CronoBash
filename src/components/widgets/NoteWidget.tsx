"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function NoteWidget() {
  const { notes, addNote } = useProductivityStore();
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const pinnedNotes = notes.filter(n => n.pinned);
  const displayNotes = (pinnedNotes.length > 0 ? pinnedNotes : notes).slice(0, 2);

  const handleSaveMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addNote({
      title: quickTitle.trim(),
      content: quickContent.trim() || 'Quick memo recorded from home screen widget.',
      category: 'Productivity',
      tags: ['QuickMemo'],
      pinned: true,
      color: '#0F172A',
    });

    setQuickTitle('');
    setQuickContent('');
    setIsAdding(false);
  };

  return (
    <div className="morphism-card bg-white p-5 space-y-4 shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:border-[#F59E0B] transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-gray-900 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Note Taker</h3>
              <p className="text-[11px] text-slate-500 font-medium">{notes.length} total notes</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=notes"
            className="text-xs text-[#D97706] hover:underline font-bold flex items-center gap-1 transition"
          >
            Notes Pad <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick Memo Creator vs Pinned Notes */}
        {isAdding ? (
          <form onSubmit={handleSaveMemo} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Memo title..."
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#F59E0B]"
            />
            <textarea
              rows={2}
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              placeholder="Memo content..."
              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-[#F59E0B] resize-none"
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-[10px] text-slate-600 font-bold hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-[10px] bg-[#F59E0B] text-gray-900 font-extrabold rounded-lg hover:bg-amber-500"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1.5">
            {displayNotes.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 font-medium">No notes recorded yet</p>
              </div>
            ) : (
              displayNotes.map(n => (
                <div key={n.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="font-bold text-slate-900 text-xs truncate block">{n.title}</span>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{n.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-[#1D1D1F] hover:bg-black text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Memo</span>
        </button>
      )}
    </div>
  );
}
