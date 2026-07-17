"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Challenge {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  stake_amount: number;
  duration_minutes: number;
  subject: string | null;
  status: 'open' | 'accepted' | 'completed';
  winner_id: string | null;
  created_at: string;
  completed_at: string | null;
  creator?: { name: string; avatar_url: string | null };
  opponent?: { name: string; avatar_url: string | null };
}

export default function ChallengesPage() {
  const { user, wallet, refreshWallet } = useAuth();
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Challenge creation form
  const [stake, setStake] = useState(100);
  const [duration, setDuration] = useState(30);
  const [subject, setSubject] = useState('Mathematics');

  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*, creator:creator_id(name, avatar_url), opponent:opponent_id(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setChallenges(data as any[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || stake <= 0) return;
    setSubmitting(true);
    setAlert(null);

    const userBalance = wallet?.balance ?? 0;
    if (userBalance < stake) {
      setAlert({ type: 'error', text: `Insufficient TKN balance. You have ${userBalance} TKN.` });
      setSubmitting(false);
      return;
    }

    try {
      // Call create_1v1_challenge RPC
      const { data, error } = await supabase
        .rpc('create_1v1_challenge', {
          p_creator_id: user.id,
          p_stake_amount: stake,
          p_duration_minutes: duration,
          p_subject: subject
        });

      if (error || (data && data.error)) {
        setAlert({ type: 'error', text: error?.message || data?.error || 'Failed to lock stakes.' });
      } else {
        setAlert({ type: 'success', text: '1v1 challenge matches created. Staked TKN locked.' });
        await refreshWallet();
        await loadChallenges();
      }
    } catch (e) {
      console.error(e);
      setAlert({ type: 'error', text: 'Error dispatching stakes.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string, stakeAmount: number) => {
    if (!user) return;
    setAlert(null);

    const userBalance = wallet?.balance ?? 0;
    if (userBalance < stakeAmount) {
      setAlert({ type: 'error', text: `Insufficient balance to match stake of ${stakeAmount} TKN.` });
      return;
    }

    try {
      // Call accept_1v1_challenge RPC
      const { data, error } = await supabase
        .rpc('accept_1v1_challenge', {
          p_challenge_id: challengeId,
          p_opponent_id: user.id
        });

      if (error || (data && data.error)) {
        setAlert({ type: 'error', text: error?.message || data?.error || 'Failed to accept challenge.' });
      } else {
        setAlert({ type: 'success', text: 'Stakes matched! Launching private study session.' });
        await refreshWallet();
        await loadChallenges();
        
        // Push user to study session room
        router.push(`/study?roomId=${challengeId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSettleChallenge = async (challengeId: string) => {
    setAlert(null);
    try {
      const { data, error } = await supabase
        .rpc('settle_1v1_challenge', { p_challenge_id: challengeId });

      if (error || (data && data.error)) {
        setAlert({ type: 'error', text: error?.message || data?.error || 'Settlement failed.' });
      } else {
        setAlert({ type: 'success', text: `Settled! Winner share credited.` });
        await refreshWallet();
        await loadChallenges();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const openChallenges = challenges.filter(c => c.status === 'open');
  const acceptedChallenges = challenges.filter(c => c.status === 'accepted');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  if (loading && challenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">SYNCING CHALLENGES telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <header className="pb-4 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">1v1 Matches Console</h2>
          <p className="text-xs text-on-surface-variant mt-1">Host custom stakes focus battles, match opponents, and claim pooled winnings</p>
        </div>
      </header>

      {alert && (
        <div className={`border rounded-lg p-4 text-xs flex items-center gap-3 ${
          alert.type === 'error' ? 'bg-error-container/15 border-error/50 text-error' : 'bg-primary-container/15 border-primary-container/50 text-primary-fixed'
        }`}>
          <span className="material-symbols-outlined text-sm">sports_esports</span>
          <span>{alert.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 cols): open match list */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active 1v1 challenges listing */}
          <section className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Active Lobbies</h3>
            
            {openChallenges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-on-surface-variant font-mono uppercase">No open challenges registered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openChallenges.map(c => (
                  <div key={c.id} className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 flex flex-col justify-between hover:border-primary-fixed transition-colors">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[9px] text-primary-fixed uppercase tracking-wider bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/30">
                          #{c.subject || 'Focus'}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">{c.duration_minutes} Minutes</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                          <img alt="Creator avatar" className="w-full h-full object-cover" src={c.creator?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} />
                        </div>
                        <div>
                          <p className="font-display text-xs font-bold text-on-surface uppercase tracking-tight">{c.creator?.name || 'Fighter'}</p>
                          <span className="text-[8px] text-on-surface-variant block font-mono">Challenger</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                      <div>
                        <p className="font-label-mono text-[8px] text-on-surface-variant uppercase font-bold">Stakes Prize</p>
                        <p className="font-mono text-sm font-bold text-on-surface">{c.stake_amount * 2} TKN</p>
                      </div>
                      
                      <button
                        onClick={() => handleAcceptChallenge(c.id, c.stake_amount)}
                        className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[10px] font-bold py-2 px-4 rounded-lg cursor-pointer"
                      >
                        Accept Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ongoing matches */}
          <section className="glass-panel rounded-xl p-6 space-y-4 border-t-2 border-t-secondary-fixed">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Accepted & Ongoing matches</h3>
            
            {acceptedChallenges.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-on-surface-variant font-mono uppercase">No active match duels currently running</p>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {acceptedChallenges.map(c => (
                  <div key={c.id} className="p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase">Challenger</p>
                        <p className="font-bold text-on-surface truncate max-w-[100px] mt-0.5">{c.creator?.name || 'Player 1'}</p>
                      </div>
                      
                      <span className="text-secondary-fixed font-bold">VS</span>

                      <div className="text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase">Opponent</p>
                        <p className="font-bold text-on-surface truncate max-w-[100px] mt-0.5">{c.opponent?.name || 'Player 2'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <div>
                        <p className="text-[9px] text-on-surface-variant uppercase">Prize Pool</p>
                        <p className="font-bold text-primary-fixed">{c.stake_amount * 2} TKN</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/study?roomId=${c.id}`)}
                          className="bg-secondary-container text-on-secondary px-3 py-1.5 rounded font-bold text-[10px] uppercase hover:bg-secondary-fixed cursor-pointer"
                        >
                          Join Study
                        </button>
                        <button
                          onClick={() => handleSettleChallenge(c.id)}
                          className="bg-primary-container text-on-primary px-3 py-1.5 rounded font-bold text-[10px] uppercase hover:bg-primary-fixed cursor-pointer"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): hosting panel & history ledger */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create Match Duel */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Host Duel</h3>
            
            <form onSubmit={handleCreateChallenge} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1.5">Stakes locked (TKN)</label>
                <input
                  type="number"
                  min={10}
                  required
                  value={stake}
                  onChange={(e) => setStake(parseInt(e.target.value))}
                  className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none"
                  >
                    <option value={15}>15 Min</option>
                    <option value={30}>30 Min</option>
                    <option value={60}>60 Min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Mathematics">Math</option>
                    <option value="Engineering">Eng</option>
                    <option value="Physics">Phys</option>
                    <option value="Design">Des</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:bg-primary-fixed transition-colors mt-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,163,0.15)]"
              >
                {submitting ? 'Locking Stakes...' : 'Host Challenge Match'}
              </button>
            </form>
          </div>

          {/* History Ledger */}
          <div className="glass-panel rounded-xl p-6 flex flex-col h-[280px]">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider mb-4">Completed Duels</h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {completedChallenges.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] text-on-surface-variant font-label-mono uppercase">No records found</p>
                </div>
              ) : (
                completedChallenges.map(c => {
                  const isUserWinner = c.winner_id === user?.id;
                  return (
                    <div key={c.id} className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg flex items-center justify-between font-mono text-[10px]">
                      <div>
                        <p className="font-bold text-on-surface uppercase tracking-tight">#{c.subject}</p>
                        <span className="text-[8px] text-on-surface-variant block mt-0.5">
                          Winner: {isUserWinner ? 'YOU' : 'OPPONENT'}
                        </span>
                      </div>
                      
                      <span className={`font-bold font-display ${isUserWinner ? 'text-primary-fixed' : 'text-error'}`}>
                        {isUserWinner ? '+' : '-'}{c.stake_amount} TKN
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
