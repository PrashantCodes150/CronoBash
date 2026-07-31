"use client";

import React, { useState } from 'react';
import { NoteItem, useProductivityStore } from '@/lib/productivity-store';
import { FileText, Plus, Pin, Trash2, Search, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function NoteTakerView() {
  const { notes, addNote, togglePinNote, deleteNote } = useProductivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Real Functional Toggles (Persisted in LocalStorage)
  const [autoSaveCloud, setAutoSaveCloud] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notes_auto_save_cloud') !== 'false';
    }
    return true;
  });

  const [markdownSyntax, setMarkdownSyntax] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notes_markdown_syntax') !== 'false';
    }
    return true;
  });

  const handleToggleAutoSaveCloud = () => {
    const nextVal = !autoSaveCloud;
    setAutoSaveCloud(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notes_auto_save_cloud', String(nextVal));
    }
    toast.success(nextVal ? 'Auto-Save Cloud sync active.' : 'Cloud sync paused.');
  };

  const handleToggleMarkdownSyntax = () => {
    const nextVal = !markdownSyntax;
    setMarkdownSyntax(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notes_markdown_syntax', String(nextVal));
    }
    toast.success(nextVal ? 'Markdown formatting mode enabled.' : 'Plain text mode enabled.');
  };

  // New Note Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [tagsInput, setTagsInput] = useState('CS, Study');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addNote({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || 'General',
      tags,
      pinned: false,
      color: '#F97316',
    });

    setTitle('');
    setContent('');
    setIsModalOpen(false);
    toast.success('Markdown note saved to vault! 📝');
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">description</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Markdown Notes</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{notes.length} Memos</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAB308] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">push_pin</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Pinned Notes</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{notes.filter(n => n.pinned).length} Pinned</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">category</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Categories</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{Array.from(new Set(notes.map(n => n.category))).length} Subjects</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">cloud_done</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Cloud Sync</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{autoSaveCloud ? 'Synced ✓' : 'Local Only'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── CONTROLS & REAL FUNCTIONAL BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">cloud</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Auto-Save Cloud</span>
            <button
              onClick={handleToggleAutoSaveCloud}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                autoSaveCloud ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${autoSaveCloud ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#F97316] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">code</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Markdown Formatting</span>
            <button
              onClick={handleToggleMarkdownSyntax}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                markdownSyntax ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${markdownSyntax ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Note</span>
          </button>
        </div>
      </div>

      {/* ── NOTES GRID ── */}
      {filteredNotes.length === 0 ? (
        <div className="morphism-card bg-white text-center py-16 space-y-3 rounded-[28px] border border-white/80">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No markdown notes found</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#F97316] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">
            + Write First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map(note => (
            <div key={note.id} className="morphism-card bg-white p-5 rounded-[24px] border border-slate-100 hover:border-[#F97316] transition-all space-y-3 flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-extrabold text-slate-900">{note.title}</h4>
                  <button onClick={() => togglePinNote(note.id)} className="text-slate-400 hover:text-amber-500 cursor-pointer p-1">
                    <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'text-amber-500 fill-current' : ''}`} />
                  </button>
                </div>

                <p className={`text-xs text-slate-600 font-medium line-clamp-4 leading-relaxed whitespace-pre-wrap ${markdownSyntax ? 'font-mono bg-slate-50 p-2 rounded-xl border border-slate-100' : ''}`}>
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold bg-orange-50 text-[#F97316] px-2.5 py-0.5 rounded-lg border border-orange-100 uppercase">
                  #{note.category}
                </span>

                <button onClick={() => deleteNote(note.id)} className="text-slate-400 hover:text-red-600 cursor-pointer p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Create Study Note</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Cheat Sheet"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note Content</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write formulas, algorithms, or key takeaways..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#F97316] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Computer Science, Math"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Save Note 📝</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
