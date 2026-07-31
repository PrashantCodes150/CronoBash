"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Room } from '@/lib/supabaseClient';

export default function ArenaPage() {
  const router = useRouter();
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock list of highlight recordings for gaming aesthetics
  const replays = [
    { id: '1', title: 'Calculus III Settle - 5h Sprint', user: 'QuantMaster', views: '1.2k views', duration: '5:00:12' },
    { id: '2', title: 'System Arch Sprint - Solo Run', user: 'CodeNinja', views: '840 views', duration: '4:15:00' },
    { id: '3', title: 'Physics Mech Exam Prep', user: 'AlphaSigma', views: '610 views', duration: '3:30:25' }
  ];

  // Fetch rooms with active sessions
  const fetchLiveRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (!error && data) {
        setLiveRooms(data as Room[]);
      }

      // Fetch top performers today from real study_sessions
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todaySessions } = await supabase
        .from('study_sessions')
        .select('user_id, focus_seconds')
        .gte('start_time', `${todayStr}T00:00:00Z`);

      if (todaySessions && todaySessions.length > 0) {
        const focusByUser: Record<string, number> = {};
        for (const s of todaySessions) {
          focusByUser[s.user_id] = (focusByUser[s.user_id] || 0) + (s.focus_seconds || 0);
        }

        const sorted = Object.entries(focusByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const userIds = sorted.map(([id]) => id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, avatar_url, is_pro')
          .in('id', userIds);

        if (usersData) {
          const userMap = new Map(usersData.map(u => [u.id, u]));
          setTopPerformers(sorted.map(([id, seconds], idx) => ({
            rank: idx + 1,
            name: userMap.get(id)?.name || 'Anonymous',
            is_pro: userMap.get(id)?.is_pro || false,
            hours: (seconds / 3600).toFixed(1)
          })));
        }
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRooms();
  }, []);

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      {/* Page Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Arena Spectator Mode</h2>
        <p className="text-xs text-on-surface-variant mt-1">Watch live study streams, follow squads, and trace highlights</p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Video Player and Live Rooms */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Featured Video Player */}
          <div className="card-base overflow-hidden relative group border-t-2 border-primary-fixed shadow-2xl">
            <div className="aspect-video w-full bg-black relative flex items-center justify-center">
              {/* Cover Image mock study stream */}
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=700" 
                alt="Active study feed"
                className="w-full h-full object-cover opacity-60"
              />
              
              {/* Video overlays */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-primary-fixed/40">
                <span className="w-2 h-2 rounded-full bg-primary-container live-pulse"></span>
                <span className="font-mono text-[9px] text-primary-fixed font-bold uppercase tracking-wider">FEATURED SQUAD: CODENINJAS</span>
              </div>

              <div className="absolute top-4 right-4 bg-black/60 px-2.5 py-1 rounded font-mono text-[9px] text-on-surface-variant">
                124 studying
              </div>

              {/* Play overlays */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,255,163,0.4)] cursor-pointer">
                  <span className="material-symbols-outlined text-4xl font-bold">play_arrow</span>
                </button>
              </div>

              {/* Controls bar */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-center text-white">
                <span className="font-label-mono text-xs font-bold uppercase">Zen Study Room Lofi</span>
                <span className="font-mono text-[10px] text-primary-fixed font-bold">Active Sprint: 01:25:40</span>
              </div>
            </div>
          </div>

          {/* Lobbies grid list */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Live Squad Feeds</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : liveRooms.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-mono">No live squads currently online</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {liveRooms.map((room) => (
                  <div key={room.id} className="card-base p-4 flex flex-col justify-between min-h-[140px] hover:border-outline transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-label-mono text-[9px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          {room.type} Room
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-primary-fixed font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-container live-pulse"></span>
                          <span>LIVE</span>
                        </div>
                      </div>
                      <h4 className="font-display text-sm font-bold text-on-surface truncate">{room.name}</h4>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1 leading-normal">
                        {room.description || 'Sprint focus timers together in competitive study squads.'}
                      </p>
                    </div>

                    <button 
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="bg-surface-variant hover:bg-surface-bright border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-[9px] px-3 py-1.5 rounded-lg transition-colors mt-4 self-end cursor-pointer"
                    >
                      Spectate Squad
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Top Performers, Ongoing Challenges, Announcements */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Performers ledger */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Top Performers Today</h3>
            {topPerformers.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-mono">No sessions logged today yet</p>
            ) : (
              <ul className="space-y-3 font-mono text-xs">
                {topPerformers.map((p) => (
                  <li key={p.rank} className="flex items-center justify-between p-2 bg-surface-container/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`font-display text-sm font-bold ${p.rank === 1 ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>#{p.rank}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-on-surface">{p.name}</span>
                        {p.is_pro && (
                          <span className="text-[7px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_5px_rgba(234,179,8,0.2)]">
                            PRO
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-on-surface-variant">{p.hours}h studied</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Active Challenges */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Weekly Settle Challenges</h3>
            <div className="space-y-3">
              <div className="bg-surface-container-high/40 border border-outline-variant p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-mono text-[9px] bg-primary-container/15 text-primary-fixed px-2 py-0.5 rounded uppercase font-bold">1000 TKN Pot</span>
                  <span className="font-mono text-[9px] text-on-surface-variant font-bold">4/10 joined</span>
                </div>
                <h4 className="text-xs text-on-surface font-bold">Deep Work Calculus Settle</h4>
                <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
                  <div className="bg-primary-container h-1" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div className="bg-surface-container-high/40 border border-outline-variant p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-label-mono text-[9px] bg-secondary-container/15 text-secondary-fixed px-2 py-0.5 rounded uppercase font-bold">500 TKN Pot</span>
                  <span className="font-mono text-[9px] text-on-surface-variant font-bold">8/8 Full</span>
                </div>
                <h4 className="text-xs text-on-surface font-bold">Rig Architecture Challenge</h4>
                <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
                  <div className="bg-secondary-fixed h-1" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights & Replays */}
          <div className="card-base p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Replays & Highlights</h3>
            <div className="space-y-3">
              {replays.map((rep) => (
                <div key={rep.id} className="p-2.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded-lg flex items-center justify-between border border-outline-variant/30 font-mono text-[11px]">
                  <div>
                    <p className="font-bold text-on-surface truncate max-w-[170px]">{rep.title}</p>
                    <span className="text-[9px] text-on-surface-variant">by {rep.user} • {rep.views}</span>
                  </div>
                  <span className="font-label-mono text-[9px] bg-surface-variant px-1.5 py-0.5 rounded font-bold">{rep.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
