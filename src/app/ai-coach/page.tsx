"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, Flame, Lightbulb, TrendingUp, Calendar, Zap, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyStat {
  day: string;
  hours: number;
}

export default function AICoachDashboard() {
  const [weeklyData, setWeeklyData] = useState<WeeklyStat[]>([]);
  const [stats, setStats] = useState({ avgFocus: 85, hoursThisWeek: 12.5, streakDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch streaks
        const { data: streakData } = await supabase
          .from('streaks')
          .select('current_streak_days')
          .eq('user_id', user.id)
          .single();

        // Populate weekly stats with random/mock focus trend
        const mockWeekly = [
          { day: 'Mon', hours: 1.5 },
          { day: 'Tue', hours: 2.2 },
          { day: 'Wed', hours: 1.8 },
          { day: 'Thu', hours: 3.0 },
          { day: 'Fri', hours: 2.5 },
          { day: 'Sat', hours: 1.0 },
          { day: 'Sun', hours: 0.5 }
        ];

        setWeeklyData(mockWeekly);
        setStats({
          avgFocus: 88,
          hoursThisWeek: 12.5,
          streakDays: streakData?.current_streak_days || 0
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs">
        Generating your focus coach report...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-850 pb-4">
        <div className="bg-orange-500/10 p-2.5 rounded border border-orange-500/30 text-orange-500">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wider uppercase font-mono">Coach Analytics Dashboard</h1>
          <p className="text-[10px] text-neutral-500 font-mono">Cognitive reports & personalized recommendations</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-3.5">
          <div className="bg-emerald-500/10 p-2 text-emerald-400 rounded">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="font-mono text-xs">
            <span className="text-neutral-500 block uppercase text-[10px]">Avg Focus Ratio</span>
            <span className="text-lg font-black text-white mt-0.5">{stats.avgFocus}%</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-3.5">
          <div className="bg-orange-500/10 p-2 text-orange-400 rounded">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="font-mono text-xs">
            <span className="text-neutral-500 block uppercase text-[10px]">Focused This Week</span>
            <span className="text-lg font-black text-white mt-0.5">{stats.hoursThisWeek} hrs</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-3.5">
          <div className="bg-amber-500/10 p-2 text-amber-400 rounded">
            <Flame className="w-5 h-5" />
          </div>
          <div className="font-mono text-xs">
            <span className="text-neutral-500 block uppercase text-[10px]">Active Streak</span>
            <span className="text-lg font-black text-white mt-0.5">{stats.streakDays} Days</span>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Weekly Focus Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#525252" fontSize={10} className="font-mono" />
                <YAxis stroke="#525252" fontSize={10} className="font-mono" />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', color: '#fff', fontSize: 11 }} />
                <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coach Recommendations */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-4">
          <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Coach Insights</h2>
          <div className="space-y-3 font-sans text-xs">
            <div className="flex gap-2 bg-black/40 border border-neutral-850 p-3 rounded-lg text-neutral-350">
              <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p>Your focus peaks around <strong>11:00 AM</strong>. We recommend scheduling stakes battles then.</p>
            </div>

            <div className="flex gap-2 bg-black/40 border border-neutral-850 p-3 rounded-lg text-neutral-350">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Your gaze-away errors are down 15% compared to last week. Good posture!</p>
            </div>

            <div className="flex gap-2 bg-black/40 border border-neutral-850 p-3 rounded-lg text-neutral-350">
              <Award className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p>Keep your daily streaks active to claim bonus coins in the Challenges lobby.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
