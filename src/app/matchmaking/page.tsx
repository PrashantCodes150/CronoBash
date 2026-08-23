"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import { Users, Search, Play, ArrowLeft, Brain } from 'lucide-react';

export default function MatchmakingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [inQueue, setInQueue] = useState(false);
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [preferredDuration, setPreferredDuration] = useState<number>(25); // minutes
  const [queueCount, setQueueCount] = useState(1);
  const [etaSeconds, setEtaSeconds] = useState(30);

  useEffect(() => {
    if (!inQueue || !user) return;
    const queueStartTime = new Date().toISOString();

    // Register user in the queue
    const enterQueue = async () => {
      await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: user.id,
          skill_level: skillLevel,
          preferred_duration: preferredDuration,
          status: 'searching'
        });
      toast.success("Entered the queue! Scanning for focus study peers...", { icon: '🔎' });

      // Call create_match edge function to trigger pairing
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_match`, {
          method: 'POST',
          headers
        });
      } catch (e) {
        console.debug("Edge function create_match call:", e);
      }
    };
    enterQueue();

    // Poll matchmaking queue status
    const pollQueue = setInterval(async () => {
      // 1. Get queue size estimate
      const { count } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true })
        .eq('skill_level', skillLevel)
        .eq('preferred_duration', preferredDuration)
        .eq('status', 'searching');
      
      setQueueCount(count || 1);
      setEtaSeconds(prev => Math.max(5, prev - 2));

      // Trigger create_match check periodically
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_match`, {
          method: 'POST',
          headers
        });
      } catch (e) {}

      // 2. Check if a match was newly created AFTER queue entry
      const { data: activeMember } = await supabase
        .from('room_members')
        .select('room_id, joined_at')
        .eq('user_id', user.id)
        .gte('joined_at', queueStartTime)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMember) {
        clearInterval(pollQueue);
        toast.success("Match found! Launching study chamber...", { icon: '🎯' });
        setTimeout(() => {
          router.push(`/study/${activeMember.room_id}`);
        }, 1500);
      }
    }, 2500);

    return () => {
      clearInterval(pollQueue);
      // Remove from queue on cleanup
      supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user.id);
    };
  }, [inQueue, user, skillLevel, preferredDuration, router]);

  const toggleQueue = () => {
    if (inQueue) {
      setInQueue(false);
      toast("Left matchmaking queue.", { icon: '🚪' });
    } else {
      setInQueue(true);
      setEtaSeconds(30);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Glowing aura */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Back */}
        {!inQueue && (
          <button
            onClick={() => router.push('/rooms')}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Lobbies
          </button>
        )}

        <div className="text-center space-y-2">
          <Brain className="w-12 h-12 text-emerald-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-black font-sans">Cognitive Matchmaker</h1>
          <p className="text-xs text-neutral-400">Match with peers of your skill level for shared sprints</p>
        </div>

        {inQueue ? (
          /* Queue scanning screen */
          <div className="space-y-6 text-center py-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Radar spin */}
              <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              <div className="absolute inset-2 border-2 border-dashed border-emerald-500/40 rounded-full animate-spin [animation-duration:10s]" />
              <Search className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="text-sm font-semibold text-emerald-400 block font-mono">SCANNING ARENA...</span>
              <span className="text-[11px] text-neutral-400 block">Queue Position: #{queueCount} in skill pool</span>
              <span className="text-[11px] text-neutral-500 block">Est. Wait: {etaSeconds}s</span>
            </div>

            <button
              onClick={toggleQueue}
              className="px-6 py-2 rounded-lg bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-950/80 text-xs font-mono font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel Matchmaking
            </button>
          </div>
        ) : (
          /* Config screen */
          <div className="space-y-4">
            
            {/* Skill */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 font-mono">YOUR EXPERIENCE RANGE</label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    className={`py-2 rounded-lg border text-[10px] sm:text-xs font-mono uppercase transition-all ${skillLevel === level ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-950 border-neutral-850 text-neutral-500'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 font-mono">SPRINT DURATION</label>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 100].map(dur => (
                  <button
                    key={dur}
                    onClick={() => setPreferredDuration(dur)}
                    className={`py-2 rounded-lg border text-xs font-mono transition-all ${preferredDuration === dur ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-950 border-neutral-850 text-neutral-500'}`}
                  >
                    {dur} Min
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleQueue}
              className="w-full mt-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <Play className="w-4 h-4 fill-black" />
              Find Duel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
