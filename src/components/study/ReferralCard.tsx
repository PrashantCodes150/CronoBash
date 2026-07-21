"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Copy, Gift, Check } from 'lucide-react';

export function ReferralCard() {
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ count: 0, coins: 0 });

  useEffect(() => {
    async function loadReferralData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use user ID or generates unique invite code based on metadata
        setInviteCode(user.id.substring(0, 8).toUpperCase());

        // Count referrals from database table
        const { data, count, error } = await supabase
          .from('referrals')
          .select('coins_awarded', { count: 'exact' })
          .eq('referrer_id', user.id);

        if (!error && data) {
          const totalCoins = data.reduce((sum, r) => sum + r.coins_awarded, 0);
          setStats({ count: count || 0, coins: totalCoins });
        }
      } catch (err) {
        console.error("Error loading referral stats:", err);
      }
    }

    loadReferralData();
  }, []);

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-905 border border-neutral-850 p-5 rounded-xl text-white font-mono flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2 text-orange-500">
          <Gift className="w-5 h-5" />
          <h3 className="text-sm font-extrabold uppercase tracking-wide">Referral Program</h3>
        </div>
        <p className="text-[11px] text-neutral-450 leading-relaxed">
          Invite friends to CogniSweep! You get 20 bonus coins when they join, and they receive a 10 coin signup reward.
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <input 
          type="text" 
          readOnly 
          value={inviteCode ? `${window.location.origin}/join/${inviteCode}` : 'Generating code...'}
          className="bg-black border border-neutral-800 rounded p-2 text-xs text-neutral-400 flex-grow focus:outline-none"
        />
        <button 
          onClick={handleCopy}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold p-2.5 rounded transition flex items-center justify-center border border-orange-400"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-4 border-t border-neutral-850 pt-3">
        <span>Friends Joined: <strong className="text-white">{stats.count}</strong></span>
        <span>Earned: <strong className="text-yellow-500">{stats.coins} Coins</strong></span>
      </div>
    </div>
  );
}
