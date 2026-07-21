"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Flame, ShieldCheck } from 'lucide-react';

export function StreakCounter() {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStreak() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('streaks')
          .select('current_streak_days')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // If no record, user streak is 0
          setStreak(0);
        } else {
          setStreak(data?.current_streak_days || 0);
        }
      } catch (err) {
        console.error("Error loading streak:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStreak();
  }, []);

  if (loading) return null;

  return (
    <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-white font-mono text-xs select-none">
      <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-neutral-500'}`} />
      <span className="font-bold">{streak} Day{streak !== 1 ? 's' : ''} Streak</span>
      {streak >= 7 && (
        <span className="bg-orange-500 text-white font-bold text-[9px] uppercase px-1 py-0.5 rounded leading-none">Week Warrior</span>
      )}
    </div>
  );
}
