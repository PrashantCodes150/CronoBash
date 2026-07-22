"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Room, RoomMember } from '@/lib/supabaseClient';

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, refreshWallet, refreshProfile } = useAuth();

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

  // PUBG Matchmaking and Countdown states
  const [readyMembers, setReadyMembers] = useState<Record<string, boolean>>({});
  const [selfReady, setSelfReady] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const matchChannelRef = useRef<any>(null);

  // Lobby Configuration settings (repurposed from study page)
  const [shareCamera, setShareCamera] = useState(true);
  const [shareGraphs, setShareGraphs] = useState(true);
  const [shareStats, setShareStats] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [settingsConfigured, setSettingsConfigured] = useState(false);

  const updateOwnerPresenceSettings = async (sc: boolean, sg: boolean, ss: boolean, th: string, conf: boolean) => {
    if (!matchChannelRef.current || !user || room?.owner_id !== user.id) return;
    try {
      await matchChannelRef.current.track({
        userId: user.id,
        isReady: true,
        joinedAt: new Date().toISOString(),
        shareCamera: sc,
        shareGraphs: sg,
        shareStats: ss,
        selectedTheme: th,
        settingsConfigured: conf
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Synthesize beep sound
  const playBeepSound = () => {
    if (typeof window === 'undefined') return;
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

  const roomOwnerIdRef = useRef<string | null>(null);
  const countdownActiveRef = useRef(false);
  const countdownTimeRef = useRef<number | null>(null);

  useEffect(() => {
    roomOwnerIdRef.current = room?.owner_id || null;
  }, [room?.owner_id]);

  useEffect(() => {
    countdownActiveRef.current = countdownActive;
  }, [countdownActive]);

  useEffect(() => {
    countdownTimeRef.current = countdownTime;
  }, [countdownTime]);

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
        const readies: Record<string, boolean> = {};
        Object.keys(state).forEach((key) => {
          const presenceObj = state[key][0] as any;
          if (presenceObj && presenceObj.userId) {
            const memberUserId = presenceObj.userId;
            readies[memberUserId] = !!presenceObj.isReady;

            // Sync selfReady if it comes from the server sync
            if (memberUserId === user.id) {
              setSelfReady(!!presenceObj.isReady);
            }

            // Sync settings from owner to members (so their local config matches the owner's)
            if (memberUserId === roomOwnerIdRef.current && memberUserId !== user.id) {
              if (presenceObj.shareCamera !== undefined) setShareCamera(presenceObj.shareCamera);
              if (presenceObj.shareGraphs !== undefined) setShareGraphs(presenceObj.shareGraphs);
              if (presenceObj.shareStats !== undefined) setShareStats(presenceObj.shareStats);
              if (presenceObj.selectedTheme !== undefined) setSelectedTheme(presenceObj.selectedTheme);
              if (presenceObj.settingsConfigured !== undefined) setSettingsConfigured(presenceObj.settingsConfigured);
            }
          }
        });
        setReadyMembers(readies);
      })
      .on('broadcast', { event: 'countdown-start' }, ({ payload }) => {
        const { targetTime, shareCamera: sc, shareGraphs: sg, shareStats: ss, theme: th } = payload;
        const targetMs = new Date(targetTime).getTime();
        setCountdownTime(targetMs);
        setCountdownActive(true);
        if (sc !== undefined) setShareCamera(sc);
        if (sg !== undefined) setShareGraphs(sg);
        if (ss !== undefined) setShareStats(ss);
        if (th !== undefined) setSelectedTheme(th);
      })
      .on('broadcast', { event: 'countdown-cancel' }, () => {
        setCountdownTime(null);
        setCountdownActive(false);
      })
      .on('broadcast', { event: 'match-launch' }, ({ payload }) => {
        const { shareCamera: sc, shareGraphs: sg, shareStats: ss, theme: th, playersCount: pc } = payload || {};
        const url = `/study/${roomId}?shareCamera=${sc ?? shareCamera}&shareGraphs=${sg ?? shareGraphs}&shareStats=${ss ?? shareStats}&theme=${th ?? selectedTheme}&playersCount=${pc ?? members.length}`;
        router.push(url);
      })
      .on('broadcast', { event: 'request-countdown-state' }, () => {
        // If owner, broadcast state
        if (roomOwnerIdRef.current === user.id && countdownActiveRef.current && countdownTimeRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'countdown-start',
            payload: { 
              targetTime: new Date(countdownTimeRef.current).toISOString(),
              shareCamera,
              shareGraphs,
              shareStats,
              theme: selectedTheme
            }
          });
        }
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Initially track self as not ready
        await channel.track({
          userId: user.id,
          isReady: false,
          joinedAt: new Date().toISOString()
        });
        // Request countdown state in case it is already running
        channel.send({
          type: 'broadcast',
          event: 'request-countdown-state',
          payload: {}
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  // Local countdown tick
  useEffect(() => {
    if (!countdownActive || !countdownTime) {
      setSecondsLeft(15);
      return;
    }

    const tick = () => {
      const msLeft = countdownTime - Date.now();
      const secs = Math.ceil(msLeft / 1000);
      if (secs <= 0) {
        setSecondsLeft(0);
        setCountdownActive(false);
        // Broadcast launch event so all opponent browsers redirect simultaneously!
        if (matchChannelRef.current) {
          matchChannelRef.current.send({
            type: 'broadcast',
            event: 'match-launch',
            payload: { 
              shareCamera, 
              shareGraphs, 
              shareStats, 
              theme: selectedTheme, 
              playersCount: members.length 
            }
          });
        }
        router.push(`/study/${roomId}?shareCamera=${shareCamera}&shareGraphs=${shareGraphs}&shareStats=${shareStats}&theme=${selectedTheme}&playersCount=${members.length}`);
      } else {
        setSecondsLeft(secs);
        playBeepSound();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [countdownActive, countdownTime, roomId, router]);

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

  const startCountdown = () => {
    if (members.length <= 1) {
      setAlertMsg({ type: 'error', text: 'At least one more contestant is required to start the matchmaking duel!' });
      return;
    }
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;
    const targetTime = new Date(Date.now() + 15000).toISOString(); // 15 seconds countdown
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

  const cancelCountdown = () => {
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;
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

  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
        router.push('/rooms'); // Redirect to lobby if not found
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

      // Kicked redirection check
      if (user && room && room.owner_id !== user.id) {
        const isStillMember = formatted.some(m => m.user_id === user.id);
        const wasMember = members.some(m => m.user_id === user.id);
        if (wasMember && !isStillMember) {
          router.push('/rooms?kicked=true');
          return;
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

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const now = Date.now();
    if (now - lastSentTime < 2000) {
      alert("Please wait 2 seconds between messages.");
      return;
    }

    const badWords = ['scam', 'spam', 'abuse', 'hack', 'cheat'];
    let cleanText = newMessage.trim();
    badWords.forEach(w => {
      const regex = new RegExp(w, 'gi');
      cleanText = cleanText.replace(regex, '***');
    });

    try {
      setLastSentTime(now);
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: cleanText
        });

      if (!error) {
        setNewMessage('');
        await loadRoomMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Setup Real-Time Subscriptions
  useEffect(() => {
    if (!roomId) return;
    
    const initData = async () => {
      setLoading(true);
      await Promise.all([loadRoomInfo(), loadRoomMembers(), loadRoomMessages(), loadConcludedSessions()]);
      setLoading(false);
    };

    initData();

    // Subscribe to Postgres changes on room_members for this room
    const channel = supabase
      .channel(`room-leaderboard-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          // Debounce: batch rapid updates (e.g. multiple members joining)
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            loadRoomMembers();
            setRealtimePulse(true);
            setTimeout(() => setRealtimePulse(false), 1500);
          }, 300);
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const chatChannel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, avatar_url, is_pro')
            .eq('id', payload.new.user_id)
            .single();

          const fullMsg = {
            ...payload.new,
            users: userData || { name: 'Contestant', avatar_url: null }
          };
          setMessages(prev => [...prev, fullMsg]);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
      supabase.removeChannel(chatChannel);
    };
  }, [roomId]);

  // Scroll chat window to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatCollapsed]);

  // Copy invitation link helper
  const [copied, setCopied] = useState(false);
  const copyInviteLink = () => {
    const link = `${window.location.origin}/rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const formatSeconds = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleJoinRoom = async () => {
    if (!user || !room) return;
    setJoining(true);
    setAlertMsg(null);

    try {
      if (room.type === 'money') {
        const { data: joinRes, error: rpcError } = await supabase
          .rpc('join_money_room', { p_user_id: user.id, p_room_id: room.id });

        if (rpcError || (joinRes && joinRes.error)) {
          const errMsg = rpcError?.message || joinRes?.error || 'Staking transaction failed.';
          setAlertMsg({ type: 'error', text: errMsg });
          setJoining(false);
          return;
        }

        await refreshWallet();
        await refreshProfile();
      } else {
        const { error: joinError } = await supabase
          .from('room_members')
          .insert({
            room_id: room.id,
            user_id: user.id,
            total_focus_seconds_today: 0
          });

        if (joinError && !joinError.message.includes('duplicate key')) {
          setAlertMsg({ type: 'error', text: 'Could not register room join state.' });
          setJoining(false);
          return;
        }
      }

      setAlertMsg({ type: 'success', text: 'Successfully joined study room!' });
      await loadRoomMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !room) return;
    setLeaving(true);
    setAlertMsg(null);

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      if (error) {
        setAlertMsg({ type: 'error', text: 'Failed to leave the room.' });
      } else {
        setAlertMsg({ type: 'success', text: 'You left the room.' });
        await loadRoomMembers();
        await refreshWallet();
        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLeaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!user || !room || room.owner_id !== user.id) return;

    const confirmDelete = window.confirm("WARNING: Are you sure you want to permanently delete this room space? All members will be kicked.");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (error) {
        alert("Failed to delete room: " + error.message);
      } else {
        router.push('/rooms');
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting room.");
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    if (!user || !room || room.owner_id !== user.id) return;

    const confirmKick = window.confirm("Are you sure you want to kick this contestant?");
    if (!confirmKick) return;

    setKickingId(targetUserId);
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', targetUserId);

      if (error) {
        setAlertMsg({ type: 'error', text: 'Failed to kick the contestant: ' + error.message });
      } else {
        setAlertMsg({ type: 'success', text: 'Contestant kicked successfully.' });
        await loadRoomMembers();
      }
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setKickingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4 font-bold">SYNCHRONIZING SQUAD DATA...</p>
      </div>
    );
  }

  if (!room) return null;

  const isMoneyRoom = room.type === 'money';

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <header className="pb-6 border-b border-outline-variant">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <h2 className="font-display text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight">
                {room.name}
              </h2>
              
              <span className={`font-label-mono text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                isMoneyRoom 
                  ? 'bg-primary-container/10 text-primary-fixed border-primary-container/30 glow-primary'
                  : 'bg-secondary-container/10 text-secondary-fixed border-secondary-container/30'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {isMoneyRoom ? 'attach_money' : 'groups'}
                </span>
                {isMoneyRoom ? 'Money Room Challenge' : `${room.type.toUpperCase()} LOBBY`}
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              {room.subject_tags.map(tag => (
                <span key={tag} className="text-on-surface-variant font-label-mono text-[10px] uppercase font-bold bg-surface-container px-2.5 py-1 rounded border border-outline-variant/30">
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
              {room.description || 'Sprint timer lobbies designed for absolute cognitive focus. Maintain top averages, log daily study hours, and compete on the active leaderboards.'}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {concludedSessions.length > 0 ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none glow-primary animate-pulse"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                RETURN TO DASHBOARD
              </button>
            ) : (
              <>
                {room.owner_id === user?.id && room.type !== 'money' && (
                  <button
                    onClick={handleDeleteRoom}
                    className="bg-error/15 hover:bg-error/25 border border-error/40 text-error font-label-mono text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none"
                    title="Delete this room space permanently"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    DELETE SPACE
                  </button>
                )}
                <button
                  onClick={() => setShowVsIntro(true)}
                  className="bg-surface-container-high hover:bg-surface-container border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none"
                  title="Replay Tekken-style VS screen intro animation"
                >
                  <span className="material-symbols-outlined text-sm">swords</span>
                  REPLAY VS INTRO
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Columns: Leaderboard, Recent Sprints & Rules */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Live Leaderboard */}
          <section className="glass-panel rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className={`relative flex h-2 w-2 ${realtimePulse ? 'scale-150' : ''} transition-transform duration-300`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-fixed"></span>
                </span>
                Active Leaderboard
                {realtimePulse && (
                  <span className="font-label-mono text-[9px] text-primary-fixed animate-pulse">LIVE</span>
                )}
              </h3>
              <span className="font-label-mono text-[10px] text-primary-fixed font-bold bg-primary-container/10 px-2.5 py-1 rounded-lg">
                {members.length} Active Users
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                    <th className="py-3 pl-4">Rank</th>
                    <th className="py-3">Contestant</th>
                    <th className="py-3 text-right">Study Time</th>
                    {room.owner_id === user?.id && room.type !== 'money' && (
                      <th className="py-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="font-mono text-xs text-on-surface">
                  {(() => {
                    const sortedMembers = concludedSessions.length > 0
                      ? [...members].sort((a, b) => {
                          const sa = concludedSessions.findIndex(s => s.user_id === a.user_id);
                          const sb = concludedSessions.findIndex(s => s.user_id === b.user_id);
                          const valA = sa === -1 ? 9999 : sa;
                          const valB = sb === -1 ? 9999 : sb;
                          return valA - valB;
                        })
                      : members;

                    return sortedMembers.map((mbr, idx) => {
                      const isCurrentUser = mbr.user_id === user?.id;
                      const name = mbr.users?.name || 'Arena Fighter';
                      const avatar = mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150';
                      
                      const saIndex = concludedSessions.findIndex(s => s.user_id === mbr.user_id);
                      const statusBadge = concludedSessions.length > 0 && saIndex !== -1
                        ? (concludedSessions.length === 2 
                            ? (saIndex === 0 ? "WINNER" : "LOSER") 
                            : `RANK ${saIndex + 1}`)
                        : null;

                      const displaySecs = concludedSessions.length > 0 && saIndex !== -1
                        ? concludedSessions[saIndex].focus_seconds
                        : mbr.total_focus_seconds_today || 0;

                      return (
                        <tr 
                          key={mbr.id} 
                          className={`border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors ${
                            isCurrentUser ? 'bg-primary-container/5 border-y-2 border-primary-container' : ''
                          }`}
                        >
                          <td className={`py-4 pl-4 font-display text-base font-extrabold ${
                            idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-on-surface-variant'
                          }`}>
                            {idx + 1}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                                <img alt={name} className="w-full h-full object-cover" src={avatar} />
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-mono text-xs ${isCurrentUser ? 'text-primary-fixed font-bold' : 'text-on-surface'}`}>
                                  {name} {isCurrentUser && '(You)'}
                                </span>
                                {mbr.users?.is_pro && (
                                  <span className="text-[7px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_5px_rgba(234,179,8,0.2)]">
                                    PRO
                                  </span>
                                )}
                                {statusBadge ? (
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                                    statusBadge.includes("WINNER") || statusBadge.includes("RANK 1")
                                      ? "bg-emerald-500/20 border border-emerald-500/50 text-[#00ffa3] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" 
                                      : "bg-red-500/20 border border-red-500/50 text-red-400"
                                  }`}>
                                    {statusBadge}
                                  </span>
                                ) : (() => {
                                  const isReady = mbr.user_id === user?.id ? selfReady : !!readyMembers[mbr.user_id];
                                  const readyBadge = room.owner_id === mbr.user_id
                                    ? "OWNER"
                                    : (isReady ? "READY" : "PREPARING");
                                  return (
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                                      readyBadge === "OWNER"
                                        ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                                        : readyBadge === "READY"
                                          ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                                          : "bg-surface-variant/40 border border-outline-variant/30 text-on-surface-variant/60"
                                    }`}>
                                      {readyBadge}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right font-bold text-on-surface-variant">
                            <span className={isCurrentUser ? 'text-primary-fixed font-bold' : ''}>
                              {formatSeconds(displaySecs)}
                            </span>
                          </td>
                          {room.owner_id === user?.id && room.type !== 'money' && (
                            <td className="py-4 text-center">
                              {mbr.user_id !== user?.id ? (
                                <button
                                  disabled={kickingId === mbr.user_id}
                                  onClick={() => handleKickMember(mbr.user_id)}
                                  className="text-[10px] bg-error/10 hover:bg-error/30 text-error border border-error/30 hover:border-error rounded px-2.5 py-1 transition-all cursor-pointer font-bold font-mono tracking-wider"
                                  title="Kick user from room"
                                >
                                  {kickingId === mbr.user_id ? 'KICKING...' : 'KICK'}
                                </button>
                              ) : (
                                <span className="text-[9px] text-on-surface-variant font-bold opacity-60 font-mono tracking-wider">ADMIN</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column: Room details & Stakes information */}
        <div className="lg:col-span-4 space-y-6">
          {/* Lobby Arena Rig Setup configuration */}
          {members.some(m => m.user_id === user?.id) && (
            <div className="glass-panel rounded-xl p-6 border-t-2 border-primary-fixed space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm font-bold text-on-surface uppercase">Arena Rig Setup</h3>
                {settingsConfigured ? (
                  <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-2 py-0.5 rounded font-black tracking-widest uppercase shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    CONFIGURED
                  </span>
                ) : (
                  <span className="text-[8px] bg-amber-500/20 border border-amber-500/50 text-amber-400 px-2 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">
                    REQUIRED
                  </span>
                )}
              </div>

              <div className="space-y-4 font-mono text-xs text-on-surface-variant">
                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Lobby Theme Select
                  </label>
                  <select
                    disabled={room.owner_id !== user?.id || countdownActive}
                    value={selectedTheme}
                    onChange={(e) => {
                      setSelectedTheme(e.target.value);
                      if (room.owner_id === user?.id) {
                        updateOwnerPresenceSettings(shareCamera, shareGraphs, shareStats, e.target.value, false);
                        setSettingsConfigured(false); // Reset confirmation on edit
                      }
                    }}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-fixed cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="dark">Cyberpunk Dark (Classic)</option>
                    <option value="pink">Neon Pink (Vaporwave)</option>
                    <option value="green">Hacker Green (Matrix)</option>
                    <option value="water">Deep Ocean Blue</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Share Webcam P2P Feed</span>
                    <input
                      type="checkbox"
                      disabled={room.owner_id !== user?.id || countdownActive}
                      checked={shareCamera}
                      onChange={(e) => {
                        setShareCamera(e.target.checked);
                        if (room.owner_id === user?.id) {
                          updateOwnerPresenceSettings(e.target.checked, shareGraphs, shareStats, selectedTheme, false);
                          setSettingsConfigured(false);
                        }
                      }}
                      className="w-4 h-4 accent-primary-fixed cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Share Real-time Graphs</span>
                    <input
                      type="checkbox"
                      disabled={room.owner_id !== user?.id || countdownActive}
                      checked={shareGraphs}
                      onChange={(e) => {
                        setShareGraphs(e.target.checked);
                        if (room.owner_id === user?.id) {
                          updateOwnerPresenceSettings(shareCamera, e.target.checked, shareStats, selectedTheme, false);
                          setSettingsConfigured(false);
                        }
                      }}
                      className="w-4 h-4 accent-primary-fixed cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Share Session Stats</span>
                    <input
                      type="checkbox"
                      disabled={room.owner_id !== user?.id || countdownActive}
                      checked={shareStats}
                      onChange={(e) => {
                        setShareStats(e.target.checked);
                        if (room.owner_id === user?.id) {
                          updateOwnerPresenceSettings(shareCamera, shareGraphs, e.target.checked, selectedTheme, false);
                          setSettingsConfigured(false);
                        }
                      }}
                      className="w-4 h-4 accent-primary-fixed cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Confirmation Button for Owner */}
                {room.owner_id === user?.id ? (
                  <button
                    disabled={countdownActive}
                    onClick={() => {
                      setSettingsConfigured(true);
                      updateOwnerPresenceSettings(shareCamera, shareGraphs, shareStats, selectedTheme, true);
                    }}
                    className={`w-full py-2.5 rounded-lg font-label-mono text-[9px] font-bold tracking-widest uppercase transition-all ${
                      settingsConfigured
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-primary-container text-on-primary hover:bg-primary-fixed'
                    } cursor-pointer`}
                  >
                    {settingsConfigured ? '✓ Match Config Locked' : 'Lock Match Config'}
                  </button>
                ) : (
                  <div className="bg-surface-container-high/40 p-2.5 rounded-lg border border-outline-variant/20 text-[9px] leading-relaxed italic text-on-surface-variant">
                    📢 Inherited configurations will be locked automatically when the admin starts the countdown.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="glass-panel rounded-xl p-6 border-t-2 border-primary-fixed space-y-6">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase">Rig Details</h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">ENTRY STAKE</span>
                <span className="font-display text-base font-black text-primary-fixed">
                  {room.entry_fee} <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
                </span>
              </div>
              <div className="py-2 border-b border-outline-variant/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">CONTESTANTS</span>
                  <span className="font-bold">{members.length} / {room.max_members}</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-primary-fixed h-1.5 rounded-full transition-all" 
                    style={{ width: `${(members.length / room.max_members) * 100}%` }}
                  ></div>
                </div>
              </div>
              {isMoneyRoom && (
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">PRIZE POOL</span>
                  <span className="font-display text-base font-black text-primary-fixed">
                    ~{(room.entry_fee * members.length * 0.9).toFixed(0)} <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">PLATFORM COMM.</span>
                <span className="font-bold text-on-surface">{room.platform_fee_percent}%</span>
              </div>
            </div>

            {alertMsg && (
              <div className={`p-3 rounded-lg text-xs font-mono border ${
                alertMsg.type === 'success' 
                  ? 'bg-primary-container/10 border-primary-container text-primary-fixed' 
                  : 'bg-error/10 border-error text-error'
              }`}>
                {alertMsg.text}
              </div>
            )}

            {concludedSessions.length > 0 ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-primary-container text-on-primary font-label-mono text-xs font-bold py-3.5 rounded-xl hover:bg-primary-fixed transition-all hover:scale-[1.02] glow-primary flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider animate-pulse"
              >
                <span className="material-symbols-outlined">dashboard</span>
                Return to Dashboard
              </button>
            ) : members.some(m => m.user_id === user?.id) ? (
              <div className="space-y-3">
                {room.owner_id === user?.id ? (
                  countdownActive ? (
                    <button
                      onClick={cancelCountdown}
                      className="w-full bg-error/20 border border-error/50 hover:bg-error/30 text-error font-label-mono text-xs font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Cancel Launch Countdown
                    </button>
                  ) : (
                    <button
                      disabled={!settingsConfigured}
                      onClick={startCountdown}
                      className="w-full bg-primary-container text-on-primary font-label-mono text-xs font-bold py-3.5 rounded-xl hover:bg-primary-fixed transition-all hover:scale-[1.02] glow-primary flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">
                        {settingsConfigured ? 'timer' : 'lock'}
                      </span>
                      {settingsConfigured ? 'Start Countdown (Matchmaking)' : 'Lock Rig Config First'}
                    </button>
                  )
                ) : (
                  <button
                    disabled={countdownActive}
                    onClick={toggleReady}
                    className={`w-full font-label-mono text-xs font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                      selfReady
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                        : 'bg-surface-container-high border border-outline-variant text-on-surface hover:border-primary-fixed hover:text-primary-fixed'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {selfReady ? 'check_circle' : 'hourglass_empty'}
                    </span>
                    {selfReady ? 'I am Ready! (Cancel)' : 'Ready Up'}
                  </button>
                )}
                <button
                  disabled={leaving || countdownActive}
                  onClick={handleLeaveRoom}
                  className="w-full bg-surface-container-high border border-outline-variant text-on-surface hover:text-error hover:border-error font-label-mono text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {leaving ? 'Leaving...' : 'Leave Room'}
                </button>
              </div>
            ) : (
              <button
                disabled={joining}
                onClick={handleJoinRoom}
                className="w-full bg-secondary-container text-on-secondary font-label-mono text-xs font-bold py-3.5 rounded-xl hover:bg-secondary-fixed transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span className="material-symbols-outlined">group_add</span>
                {joining 
                  ? 'Joining...' 
                  : isMoneyRoom 
                    ? `Stake ${room.entry_fee} TKN & Join` 
                    : 'Join Room'
                }
              </button>
            )}
          </div>

          {/* Invitation block */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h4 className="font-display text-xs font-bold text-on-surface uppercase">Invite Cohorts</h4>

            {/* Invite Code */}
            {room.invite_code && (
              <div className="space-y-1">
                <label className="font-label-mono text-[9px] text-on-surface-variant uppercase font-bold block text-left">Room Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={room.invite_code}
                    className="flex-1 bg-background border border-outline-variant rounded-lg px-3 py-2 font-mono text-[10px] text-on-surface-variant focus:outline-none focus:border-primary-fixed uppercase text-center font-bold tracking-widest text-primary-fixed"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(room.invite_code || '');
                      setAlertMsg({ type: 'success', text: `Room code ${room.invite_code} copied!` });
                    }}
                    className="bg-surface-container-high hover:bg-surface-container border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-[10px] px-3.5 rounded-lg transition-all cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Chat Panel */}
          <div className="glass-panel rounded-xl p-6 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Live Chat</h4>
              <button 
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="text-on-surface-variant hover:text-primary-fixed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {chatCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>

            {!chatCollapsed && (
              <>
                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 mb-4 pr-1 font-mono text-[10px]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-on-surface-variant uppercase tracking-tight text-center">No messages yet. Send one!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.user_id === user?.id;
                      return (
                        <div key={msg.id || index} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                            <img alt="User avatar" className="w-full h-full object-cover" src={msg.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'} />
                          </div>
                          <div className={`max-w-[75%] rounded-lg p-2 ${
                            isMe ? 'bg-primary-container text-on-primary border border-primary-container/40' : 'bg-surface-container-high border border-outline-variant text-on-surface'
                          }`}>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="font-bold text-[8px] opacity-70 truncate max-w-[80px]">{msg.users?.name || 'Contestant'}</span>
                              {msg.users?.is_pro && (
                                <span className="text-[6px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-0.5 rounded font-black tracking-tighter uppercase shrink-0">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="break-words leading-tight">{msg.message_text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Say something..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow bg-background border border-outline-variant rounded-lg px-3 py-1.5 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-fixed"
                  />
                  <button
                    type="submit"
                    className="bg-primary-container text-on-primary font-bold text-[10px] px-3.5 rounded-lg hover:bg-primary-fixed cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      {countdownActive && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center select-none animate-[fadeIn_0.2s_ease-out]">
          <div className="text-center space-y-8 max-w-md px-6 flex flex-col items-center justify-center">
            <span className="font-mono text-[9px] text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/30 px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse font-black shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              ⚡ MATCHMAKING ACTIVE ⚡
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">
              ARENA COMBATANTS LOCK-IN
            </h2>
            <div className="relative flex items-center justify-center w-64 h-64">
              {/* Splat background for countdown */}
              <svg className="absolute w-full h-full overflow-visible animate-pulse" viewBox="0 0 100 100">
                <polygon 
                  points="50,12 56,31 75,21 68,38 86,38 71,49 86,59 68,59 75,76 56,66 50,85 44,66 25,76 32,59 14,59 29,49 14,38 32,38 25,21 44,31"
                  fill="#ef4444"
                  stroke="#000000"
                  strokeWidth="3.5"
                  strokeLinejoin="miter"
                />
              </svg>
              <span 
                className="relative z-10 text-8xl font-black italic tracking-tighter text-[#facc15] select-none"
                style={{
                  fontFamily: '"Impact", "Arial Black", sans-serif',
                  textShadow: '6px 6px 0px #000, -3px -3px 0px #000, 3px -3px 0px #000, -3px 3px 0px #000'
                }}
              >
                {secondsLeft}
              </span>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
              Match starting in {secondsLeft} seconds. Players are locked in. Prepare your webcam and rig.
            </p>
            {room?.owner_id === user?.id && (
              <button
                onClick={cancelCountdown}
                className="bg-error/20 hover:bg-error/30 text-error border border-error/50 px-6 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
              >
                Cancel Launch
              </button>
            )}
          </div>
        </div>
      )}
      {showVsIntro && (
        <VsScreenOverlay
          roomName={room.name}
          roomType={room.type}
          members={members}
          onClose={() => setShowVsIntro(false)}
          concludedSessions={concludedSessions}
        />
      )}
    </div>
  );
}

function VsScreenOverlay({ 
  roomName, 
  roomType, 
  members, 
  onClose,
  concludedSessions = []
}: { 
  roomName: string, 
  roomType: string, 
  members: RoomMember[], 
  onClose: () => void,
  concludedSessions?: any[]
}) {
  const isMoney = roomType === 'money';

  // Limit displaying up to 6 players for money rooms (3 vs 3) and 10 players for public/private (5 vs 5)
  const maxDisplay = isMoney ? 6 : 10;
  const activeContestants = members.slice(0, maxDisplay);

  const half = Math.max(1, Math.ceil(activeContestants.length / 2));
  const leftTeam = activeContestants.slice(0, half);
  const rightTeam = activeContestants.slice(half);

  const getRankingLabel = (userId: string) => {
    if (concludedSessions.length === 0) return null;
    const index = concludedSessions.findIndex(s => s.user_id === userId);
    if (index === -1) return null;
    
    if (concludedSessions.length === 2) {
      return index === 0 ? "🏆 WINNER" : "💀 DEFEATED";
    } else {
      return `RANK ${index + 1} (${concludedSessions[index].focus_seconds}s)`;
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col justify-between p-6 select-none animate-[fadeIn_0.3s_ease-out]">
      {/* Flashing grid backdrop */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      {/* Lightning Split Graphic Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 -left-[100%] w-[200%] h-full bg-gradient-to-r from-transparent via-[#00ffa3]/20 via-[#7047eb]/20 to-transparent skew-x-12 animate-[sweep_3.5s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00ffa3]/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7047eb]/5 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Header bar */}
      <div className="w-full text-center py-4 border-b border-white/10 relative z-10 animate-[slideDown_0.6s_ease-out]">
        <span className={`font-mono text-xs uppercase tracking-widest font-black px-4 py-1.5 rounded-full ${
          isMoney 
            ? 'bg-primary-container/20 text-primary-fixed border border-primary-container/40 glow-primary' 
            : 'bg-secondary-container/20 text-secondary-fixed border border-secondary-container/40'
        }`}>
          {roomType} Arena Battle {concludedSessions.length > 0 ? "• MATCH CONCLUDED" : ""}
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mt-4 italic skew-x-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          {roomName}
        </h1>
      </div>

      {/* Middle VS Split section */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-between px-4 md:px-12 relative z-10 my-4 gap-8">
        
        {/* Left Side: Challenger A Details */}
        <div className="flex-1 w-full flex flex-col gap-3.5 items-center md:items-end md:pr-12 animate-[slideInLeft_0.7s_cubic-bezier(0.16,1,0.3,1)]">
          {leftTeam.length === 0 ? (
            <div className="text-right">
              <h2 className="font-display text-2xl font-black text-white/40 italic uppercase">NO CHALLENGER</h2>
            </div>
          ) : (
            leftTeam.map((mbr, i) => {
              const name = mbr.users?.name || 'Arena Fighter';
              const avatar = mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150';
              const rankLabel = getRankingLabel(mbr.user_id);
              
              const saIndex = concludedSessions.findIndex(s => s.user_id === mbr.user_id);
              const secs = concludedSessions.length > 0 && saIndex !== -1
                ? concludedSessions[saIndex].focus_seconds
                : mbr.total_focus_seconds_today || 0;
              const mins = Math.floor(secs / 60);

              return (
                <div key={mbr.id || i} className="flex items-center gap-4 flex-row-reverse skew-x-3 w-full md:w-auto">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-[#00ffa3] bg-surface-container relative shrink-0 shadow-[0_0_20px_rgba(0,255,163,0.3)]">
                    <img alt={name} src={avatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-right flex-1 md:flex-none">
                    <span className="font-mono text-[9px] text-[#00ffa3] uppercase font-bold tracking-widest block">PLAYER {i+1}</span>
                    <h2 className="font-display text-lg md:text-2xl font-black text-white italic uppercase tracking-tight truncate max-w-[200px]">{name}</h2>
                    {rankLabel && (
                      <span className={`font-mono text-[9px] font-black uppercase tracking-widest block mt-0.5 px-2 py-0.5 rounded text-right inline-block ${
                        rankLabel.includes("WINNER") || rankLabel.includes("RANK 1")
                          ? "bg-emerald-500/20 text-[#00ffa3] border border-emerald-500/50" 
                          : "bg-red-500/20 text-red-400 border border-red-500/50"
                      }`}>
                        {rankLabel}
                      </span>
                    )}
                    <div className="flex justify-end items-center gap-2 mt-1 font-mono text-[10px] text-on-surface-variant">
                      <span>{mins} MIN FOCUS</span>
                      <div className="w-16 md:w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00ffa3] h-full" style={{ width: `${Math.min(100, (mins / 120) * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VS emblem with Lightning animation */}
        <div className="relative flex items-center justify-center shrink-0 w-24 md:w-32 h-24 md:h-auto z-20">
          <div className="relative flex items-center justify-center animate-[bounce_2s_infinite]">
            <svg className="absolute w-44 h-44 opacity-80 z-0 animate-pulse pointer-events-none" viewBox="0 0 100 100">
              <path d="M 50,-10 L 40,40 L 55,40 L 30,110 L 45,60 L 30,60 Z" fill="url(#lightningGrad)" />
              <defs>
                <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff0055" />
                  <stop offset="50%" stopColor="#ff4500" />
                  <stop offset="100%" stopColor="#7047eb" />
                </linearGradient>
              </defs>
            </svg>

            <span className="text-6xl md:text-8xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-white via-orange-400 to-red-600 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)] font-display z-10 select-none">VS</span>
          </div>
        </div>

        {/* Right Side: Challenger B Details */}
        <div className="flex-1 w-full flex flex-col gap-3.5 items-center md:items-start md:pl-12 animate-[slideInRight_0.7s_cubic-bezier(0.16,1,0.3,1)]">
          {rightTeam.length === 0 ? (
            <div className="text-left py-4">
              <h2 className="font-display text-lg md:text-xl font-black text-white/30 italic uppercase tracking-wider animate-pulse">WAITING FOR OPPS...</h2>
            </div>
          ) : (
            rightTeam.map((mbr, i) => {
              const name = mbr.users?.name || 'Arena Fighter';
              const avatar = mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150';
              const rankLabel = getRankingLabel(mbr.user_id);
              
              const saIndex = concludedSessions.findIndex(s => s.user_id === mbr.user_id);
              const secs = concludedSessions.length > 0 && saIndex !== -1
                ? concludedSessions[saIndex].focus_seconds
                : mbr.total_focus_seconds_today || 0;
              const mins = Math.floor(secs / 60);

              return (
                <div key={mbr.id || i} className="flex items-center gap-4 -skew-x-3 w-full md:w-auto">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-[#7047eb] bg-surface-container relative shrink-0 shadow-[0_0_20px_rgba(112,71,235,0.3)]">
                    <img alt={name} src={avatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left flex-1 md:flex-none">
                    <span className="font-mono text-[9px] text-[#7047eb] uppercase font-bold tracking-widest block">PLAYER {leftTeam.length + i + 1}</span>
                    <h2 className="font-display text-lg md:text-2xl font-black text-white italic uppercase tracking-tight truncate max-w-[200px]">{name}</h2>
                    {rankLabel && (
                      <span className={`font-mono text-[9px] font-black uppercase tracking-widest block mt-0.5 px-2 py-0.5 rounded text-left inline-block ${
                        rankLabel.includes("WINNER") || rankLabel.includes("RANK 1")
                          ? "bg-emerald-500/20 text-[#00ffa3] border border-emerald-500/50" 
                          : "bg-red-500/20 text-red-400 border border-red-500/50"
                      }`}>
                        {rankLabel}
                      </span>
                    )}
                    <div className="flex justify-start items-center gap-2 mt-1 font-mono text-[10px] text-on-surface-variant">
                      <div className="w-16 md:w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#7047eb] h-full" style={{ width: `${Math.min(100, (mins / 120) * 100)}%` }}></div>
                      </div>
                      <span>{mins} MIN FOCUS</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="w-full text-center py-4 border-t border-white/10 relative z-10 animate-[slideUp_0.6s_ease-out] flex justify-between items-center px-4 font-mono text-[9px] text-white/50">
        <span>COGNISWEEP SYSTEM STAKES © 2026</span>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] px-6 py-2 rounded-lg border border-white/20 transition-all cursor-pointer hover:border-white/50 active:scale-95"
        >
          SKIP INTRO [SPACE]
        </button>
        <span>STATUS: READY</span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-150px) skewX(10deg); opacity: 0; }
          to { transform: translateX(0) skewX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(150px) skewX(-10deg); opacity: 0; }
          to { transform: translateX(0) skewX(0); opacity: 1; }
        }
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}} />
    </div>
  );
}
