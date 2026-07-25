"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { FileText, Plus, Pin, ArrowRight } from 'lucide-react';
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
    <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4 shadow-lg flex flex-col justify-between h-full hover:border-primary/40 transition">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Note Taker</h3>
              <p className="text-[11px] text-on-surface-variant font-mono">{notes.length} total notes</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=notes"
            className="text-xs text-primary-fixed hover:text-white font-mono flex items-center gap-1 transition"
          >
            Notes Pad <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick Memo Creator vs Pinned Notes */}
        {isAdding ? (
          <form onSubmit={handleSaveMemo} className="space-y-2 bg-surface-container-high/80 p-3 rounded-xl border border-outline-variant/40">
            <input
              type="text"
              required
              placeholder="Memo title..."
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant/40 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-primary"
            />
            <textarea
              rows={2}
              placeholder="Content..."
              value={quickContent}
              onChange={e => setQuickContent(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant/40 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary font-mono resize-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 text-on-surface-variant hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-surface-variant/50 hover:bg-surface-variant text-xs text-on-surface-variant hover:text-white border border-dashed border-outline-variant/40 transition font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              Write Quick Memo
            </button>

            {displayNotes.map(n => (
              <div
                key={n.id}
                className="p-2.5 rounded-xl border border-white/10 space-y-1"
                style={{ backgroundColor: n.color || '#0F172A' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                    {n.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    {n.title}
                  </h4>
                  <span className="text-[9px] font-mono text-white/50">{n.category}</span>
                </div>
                <p className="text-[11px] text-white/70 font-mono line-clamp-2">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
