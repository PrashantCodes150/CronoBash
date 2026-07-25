"use client";

import React from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Calendar as CalendarIcon, Clock, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="bg-surface-container rounded-2xl border border-outline-variant/50 p-5 space-y-4 shadow-lg flex flex-col justify-between h-full hover:border-primary/40 transition">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Calendar</h3>
              <p className="text-[11px] text-on-surface-variant font-mono">Events & Exams</p>
            </div>
          </div>

          <Link
            href="/tasks?tab=calendar"
            className="text-xs text-primary-fixed hover:text-white font-mono flex items-center gap-1 transition"
          >
            Full View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Today Badge */}
        <div className="flex items-center gap-3 bg-surface-container-high/70 p-3 rounded-xl border border-outline-variant/30">
          <div className="bg-primary text-black font-bold px-3 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] uppercase font-mono leading-none">{todayMonthName}</span>
            <span className="text-lg font-mono font-black leading-none">{todayDateNum}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{todayDayName}, Today</span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''} upcoming
            </span>
          </div>
        </div>

        {/* Upcoming Events preview */}
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <div className="text-xs text-center text-on-surface-variant font-mono italic py-4 bg-surface-variant/40 rounded-xl">
              No upcoming events scheduled.
            </div>
          ) : (
            upcomingEvents.map(e => (
              <div
                key={e.id}
                className="p-2.5 bg-surface-container-high/60 rounded-xl border border-outline-variant/30 flex items-center justify-between"
                style={{ borderLeftWidth: '3px', borderLeftColor: e.color || '#00FFA3' }}
              >
                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate">{e.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-mono">
                    <Clock className="w-3 h-3 text-primary-fixed" />
                    <span>{e.start_date.split(' ')[1] || e.start_date.split('T')[0]}</span>
                  </div>
                </div>
                <span
                  className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded text-black shrink-0"
                  style={{ backgroundColor: e.color || '#00FFA3' }}
                >
                  {e.category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
