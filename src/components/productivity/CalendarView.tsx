"use client";

import React, { useState } from 'react';
import { CalendarEvent, useProductivityStore } from '@/lib/productivity-store';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CalendarView() {
  const { events, addEvent, deleteEvent } = useProductivityStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Real Functional Toggles (Persisted in LocalStorage)
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cal_sync_google') !== 'false';
    }
    return true;
  });

  const [examDeadlineAlerts, setExamDeadlineAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cal_exam_alerts') !== 'false';
    }
    return true;
  });

  const handleToggleSyncGoogle = () => {
    const nextVal = !syncGoogleCalendar;
    setSyncGoogleCalendar(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cal_sync_google', String(nextVal));
    }
    if (nextVal) {
      // Export events as .ics calendar file download
      const icsData = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CronoBash//FocusArena//EN\n" +
        events.map(e => `BEGIN:VEVENT\nSUMMARY:${e.title}\nDESCRIPTION:${e.description || ''}\nDTSTART:${e.start_date.replace(/[- :]/g, '')}\nEND:VEVENT`).join('\n') +
        "\nEND:VCALENDAR";
      const blob = new Blob([icsData], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cronobash_exams_calendar.ics';
      link.click();
      toast.success('Google Calendar .ics file downloaded! Import into your calendar app. 📅');
    } else {
      toast.success('Google Calendar sync disabled.');
    }
  };

  const handleToggleExamAlerts = () => {
    const nextVal = !examDeadlineAlerts;
    setExamDeadlineAlerts(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cal_exam_alerts', String(nextVal));
    }
    toast.success(nextVal ? 'Exam & Deadline Alerts active.' : 'Exam alerts muted.');
  };

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
      study: '#3B82F6',
      exam: '#EF4444',
      deadline: '#F59E0B',
      personal: '#8B5CF6',
    };

    addEvent({
      title: title.trim(),
      description: description.trim(),
      start_date: `${selectedDay} ${startTime}`,
      end_date: `${selectedDay} ${endTime}`,
      category,
      color: categoryColors[category] || '#3B82F6',
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
    toast.success('Exam event scheduled on calendar! 📅');
  };

  const formatDateKey = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  const getEventsForDay = (dayKey: string) => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return e.start_date.startsWith(dayKey);
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">calendar_month</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Scheduled</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{events.length} Events</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">priority_high</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Official Exams</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{events.filter(e => e.category === 'exam').length} Exams</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-[#EF4444] text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">alarm</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Project Deadlines</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{events.filter(e => e.category === 'deadline').length} Pending</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">event_available</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Selected Day Events</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{selectedDayEvents.length} Active</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── REAL FUNCTIONAL BLACK PILL TOGGLE SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">download</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Export .ICS Calendar</span>
            <button
              onClick={handleToggleSyncGoogle}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                syncGoogleCalendar ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${syncGoogleCalendar ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">notifications_active</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Exam Deadline Alerts</span>
            <button
              onClick={handleToggleExamAlerts}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                examDeadlineAlerts ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${examDeadlineAlerts ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Exam Event</span>
        </button>
      </div>

      {/* ── MONTH CALENDAR & DAY EVENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 morphism-card bg-white p-6 sm:p-7 rounded-[28px] border border-white/80 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8B5CF6] font-bold">calendar_month</span>
              <h3 className="font-extrabold text-base text-slate-900">
                {monthNames[month]} {year}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-2xl bg-slate-50/50 opacity-40"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayKey = formatDateKey(dayNum);
              const dayEvents = getEventsForDay(dayKey);
              const isSelected = selectedDay === dayKey;
              const hasExam = dayEvents.some(e => e.category === 'exam');

              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDay(dayKey)}
                  className={`h-16 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-[#3B82F6] shadow-sm font-bold scale-105'
                      : hasExam && examDeadlineAlerts
                      ? 'bg-red-50/60 border-red-200 hover:border-red-400'
                      : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-extrabold ${isSelected ? 'text-[#3B82F6]' : hasExam ? 'text-red-600' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {hasExam && examDeadlineAlerts && (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 2).map((e, idx) => (
                        <span key={idx} className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color || '#3B82F6' }}></span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] font-black text-slate-400">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Events for {selectedDay}</h4>
              <p className="text-[10px] text-slate-400 font-bold">{selectedDayEvents.length} scheduled</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl cursor-pointer shadow-sm"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar p-0.5">
            {selectedDayEvents.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-8">No scheduled exams or deadlines on this day</p>
            ) : (
              selectedDayEvents.map(e => (
                <div key={e.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-slate-900">{e.title}</span>
                    <button onClick={() => deleteEvent(e.id)} className="text-slate-400 hover:text-red-600 cursor-pointer p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {e.description && <p className="text-[11px] text-slate-500 font-medium">{e.description}</p>}
                  <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                    <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {e.start_date.split(' ')[1] || '10:00'}</span>
                    <span className="px-2 py-0.5 rounded-md uppercase text-white font-extrabold" style={{ backgroundColor: e.color }}>
                      {e.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Schedule Exam or Deadline</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Physics Exam"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="study">Study Sprint</option>
                  <option value="exam">Official Exam</option>
                  <option value="deadline">Project Deadline</option>
                  <option value="personal">Personal Goal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Notes or exam syllabus..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Schedule 📅</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
