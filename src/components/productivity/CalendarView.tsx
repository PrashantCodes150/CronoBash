"use client";

import React, { useState } from 'react';
import { CalendarEvent, useProductivityStore } from '@/lib/productivity-store';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Tag, Trash2, CheckCircle2 } from 'lucide-react';

export function CalendarView() {
  const { events, tasks, addEvent, deleteEvent } = useProductivityStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CalendarEvent['category']>('study');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const categoryColors = {
      study: '#00FFA3',
      exam: '#FF4D4D',
      deadline: '#FFB800',
      personal: '#9D4EDD',
    };

    addEvent({
      title: title.trim(),
      description: description.trim(),
      start_date: `${selectedDay} ${startTime}`,
      end_date: `${selectedDay} ${endTime}`,
      category,
      color: categoryColors[category] || '#00FFA3',
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  // Helper to format date string key YYYY-MM-DD
  const formatDateKey = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Get events on a specific day key
  const getEventsForDay = (dayKey: string) => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return e.start_date.startsWith(dayKey);
    });
  };

  // Get tasks on a specific day key
  const getTasksForDay = (dayKey: string) => {
    return tasks.filter(t => t.due_date === dayKey);
  };

  const selectedDayEvents = getEventsForDay(selectedDay);
  const selectedDayTasks = getTasksForDay(selectedDay);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-high border border-outline-variant/50 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-primary-fixed" />
            Study & Exam Calendar
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Schedule study sessions, track exam dates, and view deadline agendas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:brightness-110 transition cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Main Calendar Grid + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Month Calendar Grid */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4">
          {/* Controls Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white font-display">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-xs bg-surface-variant text-primary-fixed px-2.5 py-1 rounded-lg hover:bg-surface-container-high transition font-mono"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-surface-variant text-on-surface text-xs border border-outline-variant/40 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="study">Study</option>
                <option value="exam">Exams</option>
                <option value="deadline">Deadlines</option>
                <option value="personal">Personal</option>
              </select>

              <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-lg">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-surface-container-high text-on-surface-variant hover:text-white rounded transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-surface-container-high text-on-surface-variant hover:text-white rounded transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono font-bold text-on-surface-variant py-2 border-b border-outline-variant/30">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty Offset Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 md:h-24 bg-surface-container-low/30 rounded-xl opacity-30" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayKey = formatDateKey(dayNum);
              const dayEvents = getEventsForDay(dayKey);
              const dayTasks = getTasksForDay(dayKey);
              const isSelected = selectedDay === dayKey;
              const isToday = new Date().toISOString().split('T')[0] === dayKey;

              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDay(dayKey)}
                  className={`h-20 md:h-24 p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition relative overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,255,163,0.15)]'
                      : isToday
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-outline-variant/30 bg-surface-container-high/40 hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-black'
                          : isSelected
                          ? 'bg-primary text-black'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {(dayEvents.length > 0 || dayTasks.length > 0) && (
                      <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
                    )}
                  </div>

                  {/* Indicator Pills */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(e => (
                      <div
                        key={e.id}
                        className="text-[9px] truncate font-semibold px-1 rounded text-black font-mono"
                        style={{ backgroundColor: e.color || '#00FFA3' }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-on-surface-variant font-mono">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                    {dayTasks.length > 0 && dayEvents.length < 2 && (
                      <div className="text-[9px] truncate text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1 rounded">
                        ✓ {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Agenda Sidebar for Selected Day */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4">
          <div className="border-b border-outline-variant/40 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Agenda</span>
              <span className="text-xs font-mono text-primary-fixed">{selectedDay}</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Scheduled events and deadlines for selected date
            </p>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">
              Events ({selectedDayEvents.length})
            </h4>

            {selectedDayEvents.length === 0 ? (
              <div className="text-xs text-on-surface-variant/60 italic font-mono py-4 text-center border border-dashed border-outline-variant/30 rounded-xl">
                No events scheduled for this day
              </div>
            ) : (
              selectedDayEvents.map(e => (
                <div
                  key={e.id}
                  className="bg-surface-container-high p-3 rounded-xl border border-outline-variant/40 space-y-1 relative group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: e.color || '#00FFA3' }}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-white">{e.title}</h5>
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {e.description && (
                    <p className="text-xs text-on-surface-variant">{e.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-on-surface-variant font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary-fixed" />
                      {e.start_date.split(' ')[1] || 'All Day'} - {e.end_date.split(' ')[1] || ''}
                    </span>
                    <span className="uppercase font-bold" style={{ color: e.color }}>
                      {e.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Scheduled Tasks List */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/30">
            <h4 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">
              Tasks Due Today ({selectedDayTasks.length})
            </h4>

            {selectedDayTasks.length === 0 ? (
              <div className="text-xs text-on-surface-variant/60 italic font-mono py-4 text-center border border-dashed border-outline-variant/30 rounded-xl">
                No tasks due on this day
              </div>
            ) : (
              selectedDayTasks.map(t => (
                <div
                  key={t.id}
                  className="bg-surface-container-high/60 p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${t.completed ? 'text-emerald-400' : 'text-on-surface-variant'}`} />
                    <span className={`text-xs ${t.completed ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">
                    {t.subject}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Schedule Calendar Event</h3>
            <p className="text-xs text-on-surface-variant font-mono">Date: {selectedDay}</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Exam"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Room details or notes..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-surface-variant border border-outline-variant/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="study">Study Session</option>
                  <option value="exam">Exam / Test</option>
                  <option value="deadline">Project Deadline</option>
                  <option value="personal">Personal Goal</option>
                </select>
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
