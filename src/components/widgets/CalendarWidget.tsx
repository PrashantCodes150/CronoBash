"use client";

import React from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CalendarWidget() {
  const { events } = useProductivityStore();

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingEvents = events
    .filter(e => e.start_date >= todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 3);

  const todayDateNum = new Date().getDate();
  const todayMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="morphism-card bg-white p-5 rounded-[24px] space-y-4 shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:border-[#8B5CF6] transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-sm">
              <CalendarIcon className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Calendar</h3>
              <p className="text-[11px] text-slate-500 font-medium">Events &amp; Exams</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=calendar"
            className="text-xs text-[#8B5CF6] hover:underline font-bold flex items-center gap-1 transition"
          >
            Full View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Today Badge */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="bg-[#8B5CF6] text-white font-black px-3 py-1.5 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] uppercase leading-none font-bold">{todayMonthName}</span>
            <span className="text-lg font-black leading-none">{todayDateNum}</span>
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block">{todayDayName}, Today</span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''} upcoming
            </span>
          </div>
        </div>

        {/* Upcoming Events preview */}
        <div className="space-y-1.5">
          {upcomingEvents.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
              <p className="text-xs text-slate-400 font-medium">No upcoming schedule</p>
            </div>
          ) : (
            upcomingEvents.slice(0, 2).map(evt => (
              <div key={evt.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 truncate">{evt.title}</span>
                <span className="text-[10px] text-[#8B5CF6] font-bold shrink-0">{evt.start_date}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <Link
        href="/tasks?tab=calendar"
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs text-center transition block shadow-sm"
      >
        + Add Event
      </Link>
    </div>
  );
}
