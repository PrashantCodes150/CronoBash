"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChallengeCard } from '@/components/study/ChallengeCard';
import { Target, Award, ShieldCheck, Flame } from 'lucide-react';

import LogoLoader from '@/components/LogoLoader';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  badge_name: string;
  target_minutes: number;
  completed: boolean;
  date: string;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [claimedStatus, setClaimedStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChallenges() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Query active daily challenges for today
        const { data: challengesData, error } = await supabase
          .from('daily_challenges')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setChallenges(challengesData || []);

        // Load progress records for the active user
        const { data: progressData } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id);

        const progMap: Record<string, number> = {};
        const claimMap: Record<string, boolean> = {};

        (progressData || []).forEach(p => {
          progMap[p.challenge_id] = p.progress;
          claimMap[p.challenge_id] = p.claimed_at !== null;
        });

        setProgresses(progMap);
        setClaimedStatus(claimMap);
      } catch (err) {
        console.error("Error loading daily challenges:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, []);

  const handleClaimReward = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/challenges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, challengeId })
      });

      const res = await response.json();
      if (res.error) throw new Error(res.error);

      // Update state locally
      setClaimedStatus(prev => ({
        ...prev,
        [challengeId]: true
      }));

      alert("Quest reward claimed! Coins added to wallet.");
    } catch (err: any) {
      console.error("Claim error:", err);
      alert(`Claim failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      
      {/* Header title */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <div className="bg-orange-500/10 p-2.5 rounded border border-orange-500/30 text-orange-500">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wider uppercase font-mono">Daily Arena Quests</h1>
          <p className="text-[10px] text-neutral-500 font-mono">Complete daily study missions to earn bonus coins and badges</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <LogoLoader size="md" text="FETCHING DAILY MISSIONS..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              progress={progresses[c.id] || 0}
              claimed={claimedStatus[c.id] || false}
              onClaim={handleClaimReward}
            />
          ))}
          {challenges.length === 0 && (
            <div className="col-span-2 text-center py-12 text-neutral-500 italic font-mono border border-neutral-850 rounded-xl bg-neutral-900/30">
              No active challenges loaded for today. Check back tomorrow!
            </div>
          )}
        </div>
      )}

    </div>
  );
}
