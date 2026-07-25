"use client";

import React, { useState } from 'react';
import { NoteItem, useProductivityStore } from '@/lib/productivity-store';
import { FileText, Plus, Pin, Trash2, Search, Tag, Edit3, Check, Palette } from 'lucide-react';

export function NoteTakerView() {
  const { notes, addNote, updateNote, togglePinNote, deleteNote } = useProductivityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // New/Edit Note Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [tagsInput, setTagsInput] = useState('CS, Study');
  const [color, setColor] = useState('#0F172A');

  const colorOptions = [
    { name: 'Dark Slate', hex: '#0F172A' },
    { name: 'Deep Emerald', hex: '#064E3B' },
    { name: 'Midnight Navy', hex: '#1E1B4B' },
    { name: 'Dark Amber', hex: '#451A03' },
    { name: 'Rich Burgundy', hex: '#4C0519' },
  ];

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
      color,
    });

    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return matchesSearch;
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned);

  const categories = Array.from(new Set(notes.map(n => n.category)));

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-high border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-fixed" />
            Study Notes & Memos
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Capture formulas, algorithm cheatsheets, and quick study memos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:brightness-110 transition cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create Note
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container/60 p-3 rounded-xl border border-outline-variant/40">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-variant text-on-surface text-xs rounded-lg pl-9 pr-3 py-2 border border-outline-variant/40 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-on-surface-variant font-mono">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-surface-variant text-on-surface text-xs rounded-lg px-3 py-2 border border-outline-variant/40 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="space-y-6">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Pin className="w-4 h-4 fill-amber-400 text-amber-400" />
              Pinned Notes ({pinnedNotes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedNotes.map(n => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onTogglePin={togglePinNote}
                  onDelete={deleteNote}
                  onSelectNote={setActiveNoteId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">
            All Notes ({unpinnedNotes.length})
          </h3>

          {unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant italic font-mono bg-surface-container rounded-2xl border border-outline-variant/40">
              No notes found. Click "Create Note" to add your first memo!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpinnedNotes.map(n => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onTogglePin={togglePinNote}
                  onDelete={deleteNote}
                  onSelectNote={setActiveNoteId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View/Edit Note Drawer Modal */}
      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white"
            style={{ backgroundColor: activeNote.color || '#0F172A' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <input
                type="text"
                value={activeNote.title}
                onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                className="bg-transparent text-xl font-bold text-white focus:outline-none w-full"
              />
              <button
                onClick={() => togglePinNote(activeNote.id)}
                className={`p-1.5 rounded-lg transition ${activeNote.pinned ? 'text-amber-400' : 'text-white/60 hover:text-white'}`}
              >
                <Pin className={`w-5 h-5 ${activeNote.pinned ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            <textarea
              rows={8}
              value={activeNote.content}
              onChange={e => updateNote(activeNote.id, { content: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white/90 focus:outline-none focus:border-primary resize-none font-mono leading-relaxed"
            />

            <div className="flex items-center justify-between text-xs text-white/60 font-mono pt-2">
              <span>Category: {activeNote.category}</span>
              <span>Updated: {new Date(activeNote.updated_at).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveNoteId(null)}
                className="px-5 py-2 text-sm font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Note</h3>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Traversal Notes"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your study notes, formulas, or reminders..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary font-mono resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition ${color === c.hex ? 'border-primary scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl text-on-surface-variant hover:bg-surface-variant transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:brightness-110 transition"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
  onSelectNote,
}: {
  note: NoteItem;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectNote: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl border border-outline-variant/40 p-4 space-y-3 flex flex-col justify-between transition hover:brightness-110 shadow-lg group cursor-pointer"
      style={{ backgroundColor: note.color || '#0F172A' }}
      onClick={() => onSelectNote(note.id)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-white text-base leading-snug line-clamp-1">{note.title}</h4>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-1 rounded hover:bg-white/10 transition ${note.pinned ? 'text-amber-400' : 'text-white/40 hover:text-white'}`}
            >
              <Pin className={`w-4 h-4 ${note.pinned ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-white/80 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
          {note.content}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-white/60 font-mono">
        <span className="bg-white/10 px-2 py-0.5 rounded">{note.category}</span>
        <div className="flex items-center gap-1">
          {note.tags.map(t => (
            <span key={t} className="text-primary-fixed">#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
