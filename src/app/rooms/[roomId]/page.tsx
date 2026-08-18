"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import LogoLoader from '@/components/LogoLoader';
import { supabase, Room, RoomMember } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

/* ── TEKKEN-STYLE VS SCREEN INTRO COMPONENT ── */
function TekkenVsScreenIntro({
  room,
  members,
  concludedSessions,
  onClose,
}: {
  room: Room;
  members: RoomMember[];
  concludedSessions: any[];
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const leftTeam = members.slice(0, 1);
  const rightTeam = members.slice(1);

  const getRankingLabel = (userId: string) => {
    if (concludedSessions.length === 0) return null;
    const saIndex = concludedSessions.findIndex((s) => s.user_id === userId);
    if (saIndex === -1) return null;
    if (concludedSessions.length === 2) {
      return saIndex === 0 ? "WINNER 🏆" : "DEFEAT 💀";
    }
    return `RANK ${saIndex + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/95 flex flex-col justify-between p-4 sm:p-8 animate-fadeIn select-none font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-black pointer-events-none"></div>

      <div className="w-full flex justify-between items-center z-10 border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#3B82F6] block font-mono">CRONOBASH ARENA MATCHMAKING</span>
          <h1 className="text-xl sm:text-3xl font-black text-white italic uppercase tracking-tight drop-shadow-md">{room.name}</h1>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer border border-white/20 hover:scale-105"
        >
          SKIP INTRO [SPACE]
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 relative z-10 my-6">
        <div className="flex-1 flex items-center justify-end gap-4 text-right">
          {leftTeam.map((mbr, i) => {
            const isMe = mbr.user_id === user?.id;
            const name = isMe ? (profile?.name || mbr.users?.name || 'Contestant 1') : (mbr.users?.name || 'Contestant 1');
            const avatar = isMe ? (profile?.avatar_url || mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150') : (mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150');
            const rankLabel = getRankingLabel(mbr.user_id);
            return (
              <div key={mbr.id || i} className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest block font-mono">PLAYER 1</span>
                  <h2 className="text-xl sm:text-3xl font-black text-white italic uppercase tracking-tight drop-shadow-md">{name}</h2>
                  {rankLabel && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[#3B82F6] border border-blue-400/40 inline-block mt-1 font-mono">
                      {rankLabel}
                    </span>
                  )}
                </div>
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#3B82F6] bg-slate-900 shrink-0 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  <img src={avatar} className="w-full h-full object-cover" alt={name} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative flex items-center justify-center shrink-0 w-28 h-28 select-none">
          <span 
            className="text-7xl sm:text-9xl font-black italic bg-clip-text bg-gradient-to-br from-white via-blue-400 to-indigo-600 drop-shadow-[0_0_40px_rgba(59,130,246,0.9)]"
            style={{ color: 'transparent', WebkitTextFillColor: 'transparent' }}
          >
            VS
          </span>
        </div>

        <div className="flex-1 flex items-center justify-start gap-4 text-left">
          {rightTeam.length === 0 ? (
            <div className="py-4">
              <h2 className="text-lg font-black text-slate-500 italic uppercase animate-pulse font-mono">WAITING FOR OPPONENT...</h2>
            </div>
          ) : (
            rightTeam.map((mbr, i) => {
              const isMe = mbr.user_id === user?.id;
              const name = isMe ? (profile?.name || mbr.users?.name || 'Contestant 2') : (mbr.users?.name || 'Contestant 2');
              const avatar = isMe ? (profile?.avatar_url || mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150') : (mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150');
              const rankLabel = getRankingLabel(mbr.user_id);
              return (
                <div key={mbr.id || i} className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#8B5CF6] bg-slate-900 shrink-0 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                    <img src={avatar} className="w-full h-full object-cover" alt={name} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest block font-mono">PLAYER {i + 2}</span>
                    <h2 className="text-xl sm:text-3xl font-black text-white italic uppercase tracking-tight drop-shadow-md">{name}</h2>
                    {rankLabel && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#8B5CF6] border border-purple-400/40 inline-block mt-1 font-mono">
                        {rankLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="w-full text-center py-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-mono font-extrabold">
        <span>FOCUS ARENA TELEMETRY SYSTEM</span>
        <span className="text-emerald-400">STATUS: READY</span>
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, profile, refreshWallet, refreshProfile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimePulse, setRealtimePulse] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Redesign states
  const [showVsIntro, setShowVsIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem(`seen-vs-${roomId}`);
      return !hasSeen;
    }
    return true;
  });
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [concludedSessions, setConcludedSessions] = useState<any[]>([]);

  // Matchmaking and Countdown states
  const [readyMembers, setReadyMembers] = useState<Record<string, boolean>>({});
  const [selfReady, setSelfReady] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const matchChannelRef = useRef<any>(null);

  // Lobby Configuration settings
  const [shareCamera, setShareCamera] = useState(true);
  const [shareGraphs, setShareGraphs] = useState(true);
  const [shareStats, setShareStats] = useState(true);
  const [audioBeep, setAudioBeep] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedDuration, setSelectedDuration] = useState(25);

  // Nav Dropdown state
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Synthesize beep sound
  const playBeepSound = () => {
    if (typeof window === 'undefined' || !audioBeep) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error(e);
    }
  };

  // Setup matchmaking channel
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`matchmaking-${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    matchChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const readyMap: Record<string, boolean> = {};
        Object.keys(state).forEach((uid) => {
          const presences = state[uid] as any[];
          if (presences && presences.length > 0) {
            const lastP = presences[presences.length - 1];
            readyMap[uid] = !!lastP.isReady;
          }
        });
        setReadyMembers(readyMap);
      })
      .on('broadcast', { event: 'countdown-start' }, (payload) => {
        const targetIso = payload.payload?.targetTime;
        if (targetIso) {
          setCountdownTime(new Date(targetIso).getTime());
          setCountdownActive(true);
        }
      })
      .on('broadcast', { event: 'countdown-cancel' }, () => {
        setCountdownTime(null);
        setCountdownActive(false);
      })
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        const msg = payload.payload;
        if (msg && msg.user_id !== user.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            isReady: selfReady,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  // 15 Seconds Countdown Timer Loop
  useEffect(() => {
    if (!countdownActive || !countdownTime) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((countdownTime - now) / 1000));
      const secs = Math.min(15, Math.max(0, diff));

      if (secs === 0) {
        setSecondsLeft(0);
        setCountdownActive(false);
        router.push(`/study/${roomId}?shareCamera=${shareCamera}&shareGraphs=${shareGraphs}&shareStats=${shareStats}&theme=${selectedTheme}&durationMinutes=${selectedDuration}&playersCount=${members.length}`);
      } else {
        setSecondsLeft(secs);
        playBeepSound();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [countdownActive, countdownTime, roomId, router, shareCamera, shareGraphs, shareStats, selectedTheme, selectedDuration, members.length, audioBeep]);

  const toggleReady = async () => {
    if (!matchChannelRef.current || !user) return;
    const nextReady = !selfReady;
    setSelfReady(nextReady);
    setReadyMembers(prev => ({
      ...prev,
      [user.id]: nextReady
    }));
    await matchChannelRef.current.track({
      userId: user.id,
      isReady: nextReady,
      joinedAt: new Date().toISOString()
    });
  };

  const startCountdown = async () => {
    if (members.length <= 1) {
      toast.error('At least one more contestant is required to start the matchmaking duel!');
      return;
    }
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;

    await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId);

    const targetTime = new Date(Date.now() + 15000).toISOString();
    matchChannelRef.current.send({
      type: 'broadcast',
      event: 'countdown-start',
      payload: { 
        targetTime,
        shareCamera,
        shareGraphs,
        shareStats,
        theme: selectedTheme
      }
    });
    setCountdownTime(new Date(targetTime).getTime());
    setCountdownActive(true);
  };

  const cancelCountdown = async () => {
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;

    await supabase
      .from('rooms')
      .update({ is_active: true })
      .eq('id', roomId);

    matchChannelRef.current.send({
      type: 'broadcast',
      event: 'countdown-cancel',
      payload: {}
    });
    setCountdownTime(null);
    setCountdownActive(false);
  };

  useEffect(() => {
    if (showVsIntro) {
      const timer = setTimeout(() => {
        setShowVsIntro(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`seen-vs-${roomId}`, 'true');
        }
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showVsIntro, roomId]);

  // Fetch Room information
  const loadRoomInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      if (!error && data) {
        setRoom(data as Room);
      } else {
        router.push('/rooms');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch leaderboard member details
  const loadRoomMembers = async () => {
    try {
      let formatted: RoomMember[] = [];
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_room_leaderboard', { p_room_id: roomId });

      if (!rpcError && rpcData) {
        formatted = rpcData.map((row: any) => ({
          id: row.user_id,
          room_id: roomId,
          user_id: row.user_id,
          joined_at: row.joined_at,
          total_focus_seconds_today: row.focus_seconds_today,
          users: {
            id: row.user_id,
            name: row.user_name,
            avatar_url: row.avatar_url,
            email: '',
            is_pro: row.is_pro
          }
        }));
      } else {
        const { data, error } = await supabase
          .from('room_members')
          .select('*, users:user_id(*)')
          .eq('room_id', roomId)
          .order('total_focus_seconds_today', { ascending: false });

        if (!error && data) {
          formatted = data as any[];
        }
      }

      setMembers(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch chat messages
  const loadRoomMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users:user_id(name, avatar_url, is_pro)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (!error && data) {
        setMessages(data as any[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConcludedSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*, users:user_id(name, avatar_url, is_pro)')
        .eq('room_id', roomId)
        .not('end_time', 'is', null)
        .order('focus_seconds', { ascending: false });
      if (!error && data) {
        setConcludedSessions(data);
      }
    } catch (e) {
      console.error("Error loading concluded sessions:", e);
    }
  };

  // Send message with optimistic update & real-time broadcast
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    const optimisticMsg = {
      id: 'local-' + Math.random().toString(36).substring(2, 9),
      room_id: roomId,
      user_id: user.id,
      content: msgText,
      created_at: new Date().toISOString(),
      users: {
        name: profile?.name || user.email?.split('@')[0] || 'Contestant',
        avatar_url: profile?.avatar_url || '',
        is_pro: profile?.is_pro || false
      }
    };

    // 1. Local update
    setMessages(prev => [...prev, optimisticMsg]);

    // 2. Real-time Broadcast
    if (matchChannelRef.current) {
      matchChannelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: optimisticMsg
      });
    }

    // 3. Database insert
    try {
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: msgText,
        });
    } catch (e) {
      console.error("Chat insert error:", e);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    loadRoomInfo();
    loadRoomMembers();
    loadRoomMessages();
    loadConcludedSessions();
    setLoading(false);

    const roomMembersChannel = supabase
      .channel(`room_members_${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            setRealtimePulse(true);
            loadRoomMembers();
            setTimeout(() => setRealtimePulse(false), 1200);
          }, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomMembersChannel);
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isMember = members.some((m) => m.user_id === user?.id);

  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const handleJoinRoom = async () => {
    if (!user || !room) return;
    try {
      const { error: joinError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          total_focus_seconds_today: 0
        });

      if (!joinError || joinError.message.includes('duplicate key')) {
        toast.success('Joined Arena Lobby! 🚀');
        await loadRoomMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !room) return;
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      if (!error) {
        toast.success('Left the Arena Lobby.');
        await loadRoomMembers();
        await refreshWallet();
        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRoom = async () => {
    if (!user || !room || room.owner_id !== user.id) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this room space?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('rooms').delete().eq('id', room.id);
      if (!error) {
        toast.success('Arena room deleted.');
        router.push('/rooms');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    if (!user || !room || room.owner_id !== user.id) return;
    setKickingId(targetUserId);
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', targetUserId);

      if (!error) {
        toast.success('Contestant removed from room.');
        await loadRoomMembers();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setKickingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#fafaf9] rounded-[32px] p-8">
        <LogoLoader size="md" text="SYNCHRONIZING ARENA LOBBY..." />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="bg-[#fafaf9] min-h-screen text-[#1c1917] font-sans p-4 sm:p-6 md:p-8 rounded-[32px] space-y-6 select-none relative">
      
      {/* TEKKEN-STYLE VS SCREEN INTRO OVERLAY */}
      {showVsIntro && (
        <TekkenVsScreenIntro
          room={room}
          members={members}
          concludedSessions={concludedSessions}
          onClose={() => setShowVsIntro(false)}
        />
      )}

      {/* ── TOP HEADER & LOCATION PILL ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Title & Interactive Location Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-white/80 flex items-center gap-2 cursor-pointer hover:shadow transition-all group"
            >
              <span className="font-extrabold text-sm text-slate-900">{room.name}</span>
              <span className={`material-symbols-outlined text-slate-400 text-base transition-transform ${isNavDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isNavDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNavDropdownOpen(false)}></div>
                <div className="absolute left-0 top-full mt-2 w-56 sm:w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-40 animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Lobby Navigation
                  </div>
                  <ul className="space-y-1 pt-1 text-xs font-bold text-slate-700">
                    <li>
                      <button
                        onClick={() => { router.push('/rooms'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#3B82F6]">meeting_room</span>
                        <span>Back to All Arenas</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/buddies'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#8B5CF6]">groups</span>
                        <span>Squad Buddies</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold bg-blue-50 text-[#3B82F6] border border-blue-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              #{room.type} Arena
            </span>
            <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-white/80 shadow-sm text-xs font-bold text-slate-500 font-mono">
              <span>Code: {room.invite_code || 'PUBLIC'}</span>
              {room.invite_code && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room.invite_code || '');
                    toast.success(`Invite code "${room.invite_code}" copied! 📋`);
                  }}
                  className="text-[#3B82F6] hover:text-blue-700 p-0.5 cursor-pointer ml-1"
                  title="Copy Invite Code"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Quick Action Circle Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              toast.success("Lobby link copied to clipboard! Share with your squad 🚀");
            }}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-white/80 shadow-sm flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            title="Share Lobby Link"
          >
            <span className="material-symbols-outlined text-base text-[#3B82F6]">share</span>
          </button>

          <button
            onClick={() => setShowVsIntro(true)}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-white/80 shadow-sm flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            title="Replay VS Intro Animation"
          >
            <span className="material-symbols-outlined text-base text-[#8B5CF6]">swords</span>
          </button>

          {!isMember ? (
            <button
              onClick={handleJoinRoom}
              className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1"
            >
              <span>+ Join Arena</span>
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-full transition-all cursor-pointer border border-white/80 shadow-sm"
            >
              Leave Lobby
            </button>
          )}

          {room.owner_id === user?.id && (
            <button
              onClick={handleDeleteRoom}
              className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
              title="Delete Arena"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TOP CATEGORY WIDGET CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAB308] text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg font-bold">star</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
              <p className="text-sm font-black text-slate-900 uppercase mt-0.5">{room.type}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-700 text-sm transition-colors">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg font-bold">group</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roster</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{members.length} / {room.max_members}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-700 text-sm transition-colors">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg font-bold">timer</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{selectedDuration} Mins</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-700 text-sm transition-colors">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between group hover:border-orange-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg font-bold">local_fire_department</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{selfReady ? 'Ready' : 'Preparing'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-700 text-sm transition-colors">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg font-bold">insights</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemetry</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{shareCamera ? 'Camera On' : 'Sensors Active'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-700 text-sm transition-colors">north_east</span>
        </div>

      </div>

      {/* ── DEVICE TOGGLES PANEL ── */}
      <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Lobby Devices &amp; Sensor Controls
          </h3>
          <span className="text-xs font-bold text-slate-400">Live AI Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">videocam</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">Webcam Stream</span>
            </div>

            <button
              onClick={() => setShareCamera(!shareCamera)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                shareCamera ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shareCamera ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">show_chart</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">Focus Graphs</span>
            </div>

            <button
              onClick={() => setShareGraphs(!shareGraphs)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                shareGraphs ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shareGraphs ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EAB308] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">volume_up</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">Audio Telemetry</span>
            </div>

            <button
              onClick={() => setAudioBeep(!audioBeep)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                audioBeep ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${audioBeep ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">check_circle</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">Ready Status</span>
            </div>

            <button
              onClick={toggleReady}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                selfReady ? 'bg-[#10B981]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${selfReady ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>
      </div>

      {/* ── COUNTDOWN BANNERS ── */}
      {countdownActive && (
        <div className="morphism-card bg-white p-6 rounded-[28px] border-2 border-[#8B5CF6] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center font-black text-xl shadow-md">
              {secondsLeft}s
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Match Launch Sequence Active</h3>
              <p className="text-xs text-slate-500 font-medium">Entering neural study room in {secondsLeft} seconds...</p>
            </div>
          </div>

          {room.owner_id === user?.id && (
            <button
              onClick={cancelCountdown}
              className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel Match Launch
            </button>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT GRID (12 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE LEADERBOARD & CONCLUDED DUELS (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Roster */}
          <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-base font-bold">leaderboard</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Active Arena Roster</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{members.length} contestants joined</p>
                </div>
              </div>

              {room.owner_id === user?.id && members.length > 1 && !countdownActive && (
                <button
                  onClick={startCountdown}
                  className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-2xl hover:scale-105 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base text-[#10B981]">play_arrow</span>
                  <span>Start Match Duel</span>
                </button>
              )}
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 pl-2">Rank</th>
                    <th className="py-3">Contestant</th>
                    <th className="py-3 text-right">Study Time</th>
                    {room.owner_id === user?.id && (
                      <th className="py-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-slate-900">
                  {members.map((mbr, idx) => {
                    const isCurrentUser = mbr.user_id === user?.id;
                    const name = isCurrentUser ? (profile?.name || mbr.users?.name || 'Arena Fighter') : (mbr.users?.name || 'Arena Fighter');
                    const avatar = isCurrentUser ? (profile?.avatar_url || mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150') : (mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150');
                    const isReady = mbr.user_id === user?.id ? selfReady : !!readyMembers[mbr.user_id];

                    return (
                      <tr 
                        key={mbr.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          isCurrentUser ? 'bg-blue-50/60 font-bold' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-2 font-black text-sm">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span className="font-extrabold text-slate-900">{name} {isCurrentUser && '(You)'}</span>
                              {room.owner_id === mbr.user_id ? (
                                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold uppercase border border-amber-200">Owner</span>
                              ) : (
                                <span className={`text-[8px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                                  isReady ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {isReady ? 'READY' : 'PREPARING'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-slate-900">
                          {formatSeconds(mbr.total_focus_seconds_today || 0)}
                        </td>
                        {room.owner_id === user?.id && (
                          <td className="py-3.5 text-center">
                            {mbr.user_id !== user?.id && (
                              <button
                                disabled={kickingId === mbr.user_id}
                                onClick={() => handleKickMember(mbr.user_id)}
                                className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                {kickingId === mbr.user_id ? 'Kicking...' : 'Kick'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Concluded Standings */}
          {concludedSessions.length > 0 && (
            <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F59E0B] font-bold">emoji_events</span>
                  <h3 className="font-extrabold text-sm text-slate-900">Concluded Match Standings</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{concludedSessions.length} recorded</span>
              </div>

              <div className="space-y-2.5">
                {concludedSessions.map((sess, idx) => (
                  <div key={sess.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${
                        idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx === 0 ? 'WINNER 🏆' : `RANK ${idx + 1}`}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{sess.users?.name || 'Contestant'}</span>
                    </div>

                    <span className="text-xs font-extrabold text-[#3B82F6]">
                      {Math.round((sess.focus_seconds || 0) / 60)}m Focus
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: REALTIME ARENA CHAT (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Arena Chat Box */}
          <div className="morphism-card bg-white p-4 sm:p-6 rounded-[28px] border border-white/80 shadow-sm flex flex-col h-[350px] sm:h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] font-bold">chat</span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Arena Live Chat
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-1">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">chat_bubble_outline</span>
                  <p className="text-xs text-slate-400 font-medium">No messages in arena chat yet.</p>
                  <p className="text-[10px] text-slate-400">Say hello to your squad below!</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isSelf = m.user_id === user?.id;
                  const senderName = m.users?.name || 'Fighter';
                  return (
                    <div key={m.id || i} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-bold text-slate-400 mb-0.5">{senderName}</span>
                      <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        isSelf ? 'bg-[#1D1D1F] text-white font-medium shadow-sm' : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Send Chat Form */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type message to squad..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6] font-medium"
              />
              <button
                type="submit"
                className="bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-transform hover:scale-105 cursor-pointer shadow-sm flex items-center gap-1"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
