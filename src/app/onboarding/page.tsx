"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-context';

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [dailyGoal, setDailyGoal] = useState(120);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const subjectsList = [
    { name: 'Mathematics', icon: 'functions' },
    { name: 'Engineering', icon: 'construction' },
    { name: 'Code Review', icon: 'code' },
    { name: 'Physics', icon: 'science' },
    { name: 'Literature', icon: 'menu_book' },
    { name: 'Graphic Design', icon: 'palette' }
  ];

  const handleGoalChange = (val: number) => {
    setDailyGoal(val);
  };

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Save onboarding metrics to the database user profile
      const { error } = await supabase
        .from('users')
        .update({
          daily_goal_minutes: dailyGoal
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving onboarding data:', error);
      } else {
        await refreshProfile();
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if user not logged in
  useEffect(() => {
    if (!user) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
        }
      };
      checkSession();
    }
  }, [user, router]);

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center bg-grid-pattern p-6">
      <div className="w-full max-w-xl bg-surface-container border border-outline-variant rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="text-center mb-8">
          <span className="font-mono text-xs text-primary-fixed uppercase tracking-wider font-bold bg-primary-container/10 px-3 py-1 rounded-full">
            Step 2: Initialization
          </span>
          <h1 className="font-display text-2xl font-black text-on-surface mt-4 uppercase">
            Setup Your Focus Rig
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Configure target multipliers and subjects for the matchmaking lobby
          </p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="space-y-8">
          {/* Daily Goal minutes selector */}
          <div className="space-y-3">
            <label className="block font-label-mono text-xs text-on-surface-variant uppercase">
              Daily Focus Target (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[60, 120, 180, 240].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleGoalChange(mins)}
                  className={`py-3 rounded-lg border font-label-mono text-xs font-bold transition-all cursor-pointer ${
                    dailyGoal === mins
                      ? 'bg-primary-container text-on-primary border-primary-container shadow-[0_0_10px_rgba(0,255,163,0.2)]'
                      : 'bg-background border-outline-variant text-on-surface hover:border-primary-fixed-dim'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Subjects selector */}
          <div className="space-y-3">
            <label className="block font-label-mono text-xs text-on-surface-variant uppercase">
              Primary Study Disciplines
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subjectsList.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.name);
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => toggleSubject(sub.name)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-secondary-container/20 border-secondary text-secondary-fixed shadow-[0_0_8px_rgba(204,189,255,0.2)]'
                        : 'bg-background border-outline-variant text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{sub.icon}</span>
                    <span className="font-label-mono text-[10px] uppercase font-bold">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera preference toggle */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary-fixed mt-0.5">videocam</span>
              <div>
                <h4 className="font-label-mono text-xs text-on-surface uppercase font-bold">
                  Camera-based focus detection
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                  Uses local face-tracking to check attention states. Helps claim money room multipliers.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors cursor-pointer ${
                cameraEnabled ? 'bg-primary-container' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-4 h-4 bg-background rounded-full absolute transition-all ${
                  cameraEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary font-label-mono text-sm font-bold py-3.5 rounded-lg hover:bg-primary-fixed transition-colors shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:scale-[1.01] cursor-pointer"
          >
            {loading ? 'Registering Rig Parameters...' : 'Complete Configuration & Enter Arena'}
          </button>
        </form>
      </div>
    </div>
  );
}
