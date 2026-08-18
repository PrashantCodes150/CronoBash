"use client";

import React from 'react';
import { Award } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { useAuth } from '@/components/auth-context';

interface LeaderboardRowProps {
  rank: number;
  user: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    total_focus_hours: number;
    avg_focus_percent: number;
    win_rate: number;
    verified_badge?: boolean;
    level?: number;
    points?: number;
    followers_count?: number;
  };
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ rank, user, isCurrentUser = false }: LeaderboardRowProps) {
  const { profile } = useAuth();
  const avatarToDisplay = (isCurrentUser && profile?.avatar_url) ? profile.avatar_url : (user.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150');
  const nameToDisplay = (isCurrentUser && profile?.name) ? profile.name : user.name;

  const avgFocusColor = user.avg_focus_percent >= 80 
    ? 'text-emerald-400' 
    : user.avg_focus_percent < 50 
      ? 'text-red-500' 
      : 'text-neutral-300';

  return (
    <tr className={`border-b border-neutral-850 hover:bg-neutral-850/20 transition ${isCurrentUser ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : ''}`}>
      {/* Rank Column */}
      <td className="p-3 font-mono font-bold text-neutral-400">
        {rank === 1 ? (
          <span className="flex items-center gap-1 text-yellow-500">
            <Award className="w-4 h-4 fill-yellow-500/10" />
            <span>1</span>
          </span>
        ) : rank === 2 ? (
          <span className="flex items-center gap-1 text-slate-350">
            <Award className="w-4 h-4 fill-slate-300/10" />
            <span>2</span>
          </span>
        ) : rank === 3 ? (
          <span className="flex items-center gap-1 text-amber-700">
            <Award className="w-4 h-4 fill-amber-700/10" />
            <span>3</span>
          </span>
        ) : (
          rank
        )}
      </td>

      {/* Profile Avatar, Name & Twitter/Insta Verified Checkmark */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          <img 
            src={avatarToDisplay}
            alt={nameToDisplay}
            className="w-8 h-8 rounded-full border border-neutral-800 object-cover"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white text-xs truncate max-w-[140px]">{nameToDisplay}</span>
            <VerifiedBadge level={user.level || 1} followersCount={user.followers_count || 0} isVerified={user.verified_badge} size="sm" showLevelNumber={true} />
            {isCurrentUser && (
              <span className="bg-orange-500/20 text-orange-400 text-[9px] font-mono font-black uppercase px-1 rounded border border-orange-500/30">You</span>
            )}
          </div>
        </div>
      </td>

      {/* Focus Hours */}
      <td className="p-3 font-mono text-neutral-200 hidden sm:table-cell">{user.total_focus_hours.toFixed(1)}h</td>

      {/* Points / XP */}
      <td className="p-3 font-mono text-emerald-400 font-bold hidden md:table-cell">{user.points || 0} XP</td>

      {/* Average Focus % */}
      <td className={`p-3 font-mono font-bold ${avgFocusColor} hidden md:table-cell`}>{user.avg_focus_percent}%</td>

      {/* Match Win Rate */}
      <td className="p-3 font-mono text-neutral-450 hidden lg:table-cell">{user.win_rate.toFixed(1)}%</td>
    </tr>
  );
}
