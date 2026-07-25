"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Room, RoomMember } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

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
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [settingsConfigured, setSettingsConfigured] = useState(false);

  const updateOwnerPresenceSettings = async (sc: boolean, sg: boolean, ss: boolean, th: string, dur: number, conf: boolean) => {
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
        selectedDuration: dur,
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
              if (presenceObj.selectedDuration !== undefined) setSelectedDuration(presenceObj.selectedDuration);
              if (presenceObj.settingsConfigured !== undefined) setSettingsConfigured(presenceObj.settingsConfigured);
            }
          }
        });
        setReadyMembers(readies);
        loadRoomMembers();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presenceData = newPresences[0] as any;
        if (presenceData && key !== user?.id) {
          toast.success(`${presenceData.name || 'A contestant'} joined the arena!`, { icon: '👋', duration: 4000 });
          loadRoomMembers();
        }
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        if (payload && payload.user_id !== user?.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
        }
      })
      .on('broadcast', { event: 'countdown-start' }, ({ payload }) => {
        const { targetTime, shareCamera: sc, shareGraphs: sg, shareStats: ss, theme: th, duration: dur } = payload;
        const targetMs = new Date(targetTime).getTime();
        setCountdownTime(targetMs);
        setCountdownActive(true);
        if (sc !== undefined) setShareCamera(sc);
        if (sg !== undefined) setShareGraphs(sg);
        if (ss !== undefined) setShareStats(ss);
        if (th !== undefined) setSelectedTheme(th);
        if (dur !== undefined) setSelectedDuration(dur);
      })
      .on('broadcast', { event: 'countdown-cancel' }, () => {
        setCountdownTime(null);
        setCountdownActive(false);
      })
      .on('broadcast', { event: 'match-launch' }, ({ payload }) => {
        const { shareCamera: sc, shareGraphs: sg, shareStats: ss, theme: th, duration: dur, playersCount: pc } = payload || {};
        const url = `/study/${roomId}?shareCamera=${sc ?? shareCamera}&shareGraphs=${sg ?? shareGraphs}&shareStats=${ss ?? shareStats}&theme=${th ?? selectedTheme}&durationMinutes=${dur ?? selectedDuration}&playersCount=${pc ?? members.length}`;
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
              theme: selectedTheme,
              duration: selectedDuration
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
              duration: selectedDuration,
              playersCount: members.length 
            }
          });
        }
        router.push(`/study/${roomId}?shareCamera=${shareCamera}&shareGraphs=${shareGraphs}&shareStats=${shareStats}&theme=${selectedTheme}&durationMinutes=${selectedDuration}&playersCount=${members.length}`);
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

  const startCountdown = async () => {
    if (members.length <= 1) {
      setAlertMsg({ type: 'error', text: 'At least one more contestant is required to start the matchmaking duel!' });
      return;
    }
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;

    // Lock public room so outside users cannot enter while match is playing
    await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId);

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

  const cancelCountdown = async () => {
    if (!matchChannelRef.current || room?.owner_id !== user?.id) return;

    // Unlock room if countdown is cancelled
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
      toast.error("Please wait 2 seconds between messages.");
      return;
    }

    const badWords = ['scam', 'spam', 'abuse', 'hack', 'cheat'];
    let cleanText = newMessage.trim();
    badWords.forEach(w => {
      const regex = new RegExp(w, 'gi');
      cleanText = cleanText.replace(regex, '***');
    });

    const tempMsg = {
      id: Math.random().toString(),
      room_id: roomId,
      user_id: user.id,
      message_text: cleanText,
      created_at: new Date().toISOString(),
      users: {
        name: profile?.name || user.email?.split('@')[0] || 'Contestant',
        avatar_url: profile?.avatar_url || null,
        is_pro: profile?.is_pro || false
      }
    };

    // 1. Instant optimistic update (0ms UI latency!)
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setLastSentTime(now);

    // 2. Realtime broadcast for zero-latency arrival across all clients (<30ms)
    if (matchChannelRef.current) {
      matchChannelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: tempMsg
      });
    }

    // 3. Persist to DB in background
    try {
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: cleanText
        });
    } catch (e) {
      console.error("DB message insert error:", e);
    }
  };

  // Setup Real-Time Subscriptions & Initial Data
  useEffect(() => {
    if (!roomId) return;
    
    const initData = async () => {
      setLoading(true);
      await Promise.all([loadRoomInfo(), loadRoomMembers(), loadRoomMessages(), loadConcludedSessions()]);
      setLoading(false);
    };

    initData();
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

    if (room.is_active === false) {
      setAlertMsg({ type: 'error', text: 'Match in progress! Public study room is currently locked.' });
      setJoining(false);
      return;
    }

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
    <div className="space-y-6 select-none">
      {/* Top Header Section with Claymorphic & Neumorphic 3D styling */}
      <header className="pb-6 border-b border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border border-emerald-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 p-6.5 rounded-3xl shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                <span>{room.name}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </h2>
              
              <span className={`font-label-mono text-xs font-bold px-4 py-1.5 rounded-full border flex items-center gap-1.5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8),_inset_-2px_-2px_4px_rgba(255,255,255,0.03),_0_0_12px_rgba(0,255,163,0.2)] ${
                isMoneyRoom 
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/40 font-bold'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 font-bold'
              }`}>
                <span className="material-symbols-outlined text-sm font-bold animate-pulse">
                  {isMoneyRoom ? 'attach_money' : 'groups'}
                </span>
                {isMoneyRoom ? 'Money Room Challenge' : `${room.type.toUpperCase()} LOBBY`}
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              {room.subject_tags.map(tag => (
                <span key={tag} className="text-emerald-300 font-label-mono text-[10px] uppercase font-bold bg-neutral-950 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]">
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-xs text-emerald-300/80 font-mono max-w-3xl leading-relaxed">
              {room.description || 'Sprint timer lobbies designed for absolute cognitive focus. Maintain top averages, log daily study hours, and compete on the active leaderboards.'}
            </p>
          </div>
          <div className="flex gap-3 shrink-0 relative z-10">
            {concludedSessions.length > 0 ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold py-3 px-5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer select-none shadow-[-4px_-4px_12px_rgba(255,255,255,0.05),_6px_6px_16px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,255,163,0.35)] hover:scale-105 border border-emerald-400 animate-pulse"
              >
                <span className="material-symbols-outlined text-sm font-bold">dashboard</span>
                RETURN TO DASHBOARD
              </button>
            ) : (
              <>
                {room.owner_id === user?.id && room.type !== 'money' && (
                  <button
                    onClick={handleDeleteRoom}
                    className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-label-mono text-xs font-bold py-3 px-5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer select-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)]"
                    title="Delete this room space permanently"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    DELETE SPACE
                  </button>
                )}
                <button
                  onClick={() => setShowVsIntro(true)}
                  className="bg-neutral-950 hover:bg-neutral-900 border border-emerald-500/30 text-white hover:text-emerald-400 font-label-mono text-xs font-bold py-3 px-5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer select-none shadow-[-4px_-4px_12px_rgba(255,255,255,0.02),_6px_6px_16px_rgba(0,0,0,0.8)] hover:scale-105"
                  title="Replay Tekken-style VS screen intro animation"
                >
                  <span className="material-symbols-outlined text-sm font-bold animate-bounce">swords</span>
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
          
          {/* Live Leaderboard with Claymorphic & Neumorphic 3D Container */}
          <section className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className={`relative flex h-2.5 w-2.5 ${realtimePulse ? 'scale-150' : ''} transition-transform duration-300`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>Active Leaderboard</span>
                {realtimePulse && (
                  <span className="font-label-mono text-[9px] text-emerald-400 animate-pulse font-bold">LIVE</span>
                )}
              </h3>
              <span className="font-label-mono text-[10px] text-emerald-400 font-bold bg-neutral-950 px-3 py-1 rounded-full border border-emerald-500/40 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]">
                {members.length} Active Users
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-emerald-500/20 font-label-mono text-[10px] text-emerald-300/80 uppercase tracking-widest">
                    <th className="py-3 pl-4">Rank</th>
                    <th className="py-3">Contestant</th>
                    <th className="py-3 text-right">Study Time</th>
                    {room.owner_id === user?.id && room.type !== 'money' && (
                      <th className="py-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="font-mono text-xs text-white">
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
                          className={`border-b border-emerald-500/10 hover:bg-emerald-950/20 transition-all ${
                            isCurrentUser ? 'bg-emerald-500/10 border-y-2 border-emerald-500/40' : ''
                          }`}
                        >
                          <td className={`py-4 pl-4 font-display text-base font-extrabold ${
                            idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-neutral-400'
                          }`}>
                            {idx + 1}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 shrink-0 shadow-[0_0_8px_rgba(0,255,163,0.3)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-950">
                                  <img alt={name} className="w-full h-full object-cover" src={avatar} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-mono text-xs ${isCurrentUser ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                                  {name} {isCurrentUser && '(You)'}
                                </span>
                                {mbr.users?.is_pro && (
                                  <span className="text-[7px] bg-amber-500/20 border border-amber-500/50 text-amber-400 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                    PRO
                                  </span>
                                )}
                                {statusBadge ? (
                                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase ${
                                    statusBadge.includes("WINNER") || statusBadge.includes("RANK 1")
                                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(0,255,163,0.3)] animate-pulse" 
                                      : "bg-rose-500/20 border border-rose-500/50 text-rose-400"
                                  }`}>
                                    {statusBadge}
                                  </span>
                                ) : (() => {
                                  const isReady = mbr.user_id === user?.id ? selfReady : !!readyMembers[mbr.user_id];
                                  const readyBadge = room.owner_id === mbr.user_id
                                    ? "OWNER"
                                    : (isReady ? "READY" : "PREPARING");
                                  return (
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase ${
                                      readyBadge === "OWNER"
                                        ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                                        : readyBadge === "READY"
                                          ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(0,255,163,0.3)]"
                                          : "bg-neutral-950 border border-white/5 text-neutral-400 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]"
                                    }`}>
                                      {readyBadge}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right font-bold text-emerald-300">
                            <span className={isCurrentUser ? 'text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(0,255,163,0.4)]' : ''}>
                              {formatSeconds(displaySecs)}
                            </span>
                          </td>
                          {room.owner_id === user?.id && room.type !== 'money' && (
                            <td className="py-4 text-center">
                              {mbr.user_id !== user?.id ? (
                                <button
                                  disabled={kickingId === mbr.user_id}
                                  onClick={() => handleKickMember(mbr.user_id)}
                                  className="text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl px-3 py-1 transition-all cursor-pointer font-bold font-mono tracking-wider shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]"
                                  title="Kick user from room"
                                >
                                  {kickingId === mbr.user_id ? 'KICKING...' : 'KICK'}
                                </button>
                              ) : (
                                <span className="text-[9px] text-amber-400 font-bold opacity-80 font-mono tracking-wider">ADMIN</span>
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
            <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm font-bold text-white uppercase">Arena Rig Setup</h3>
                {settingsConfigured ? (
                  <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-2.5 py-1 rounded-full font-black tracking-widest uppercase shadow-[0_0_8px_rgba(0,255,163,0.3)]">
                    CONFIGURED
                  </span>
                ) : (
                  <span className="text-[8px] bg-amber-500/20 border border-amber-500/50 text-amber-400 px-2.5 py-1 rounded-full font-black tracking-widest uppercase animate-pulse">
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
                        updateOwnerPresenceSettings(shareCamera, shareGraphs, shareStats, e.target.value, selectedDuration, false);
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

                {/* Session Duration Selector */}
                <div className="space-y-2">
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Target Session Duration
                  </label>
                  <select
                    disabled={room.owner_id !== user?.id || countdownActive}
                    value={selectedDuration}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      setSelectedDuration(dur);
                      if (room.owner_id === user?.id) {
                        updateOwnerPresenceSettings(shareCamera, shareGraphs, shareStats, selectedTheme, dur, false);
                        setSettingsConfigured(false);
                      }
                    }}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-2 font-mono text-[10px] text-on-surface focus:outline-none focus:border-primary-fixed cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value={5}>5 Minutes (Sprint)</option>
                    <option value={15}>15 Minutes (Short)</option>
                    <option value={25}>25 Minutes (Standard Pomodoro)</option>
                    <option value={45}>45 Minutes (Extended)</option>
                    <option value={60}>60 Minutes (Deep Focus)</option>
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
                          updateOwnerPresenceSettings(e.target.checked, shareGraphs, shareStats, selectedTheme, selectedDuration, false);
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
                          updateOwnerPresenceSettings(shareCamera, e.target.checked, shareStats, selectedTheme, selectedDuration, false);
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
                          updateOwnerPresenceSettings(shareCamera, shareGraphs, e.target.checked, selectedTheme, selectedDuration, false);
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
                      updateOwnerPresenceSettings(shareCamera, shareGraphs, shareStats, selectedTheme, selectedDuration, true);
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

          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)] space-y-6">
            <h3 className="font-display text-sm font-bold text-white uppercase">Rig Details</h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                <span className="text-emerald-300/80">ENTRY STAKE</span>
                <span className="font-display text-base font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]">
                  {room.entry_fee} <span className="text-[10px] text-emerald-300 font-normal">TKN</span>
                </span>
              </div>
              <div className="py-2 border-b border-emerald-500/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/80">CONTESTANTS</span>
                  <span className="font-bold text-white">{members.length} / {room.max_members}</span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(0,255,163,0.5)]" 
                    style={{ width: `${(members.length / room.max_members) * 100}%` }}
                  ></div>
                </div>
              </div>
              {isMoneyRoom && (
                <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                  <span className="text-emerald-300/80">PRIZE POOL</span>
                  <span className="font-display text-base font-black text-amber-400">
                    ~{(room.entry_fee * members.length * 0.9).toFixed(0)} <span className="text-[10px] text-amber-300 font-normal">TKN</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-emerald-500/20">
                <span className="text-emerald-300/80">PLATFORM COMM.</span>
                <span className="font-bold text-white">{room.platform_fee_percent}%</span>
              </div>
            </div>

            {alertMsg && (
              <div className={`p-3 rounded-2xl text-xs font-mono border shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] ${
                alertMsg.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                {alertMsg.text}
              </div>
            )}

            {concludedSessions.length > 0 ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold py-3.5 rounded-2xl transition-all hover:scale-105 shadow-[-4px_-4px_12px_rgba(255,255,255,0.05),_6px_6px_16px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,255,163,0.35)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider animate-pulse border border-emerald-400"
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
                      className="w-full bg-rose-500/20 border border-rose-500/50 hover:bg-rose-500/30 text-rose-300 font-label-mono text-xs font-bold py-3.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)]"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Cancel Launch Countdown
                    </button>
                  ) : (
                    <button
                      disabled={!settingsConfigured}
                      onClick={startCountdown}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold py-3.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-[-4px_-4px_12px_rgba(255,255,255,0.05),_6px_6px_16px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,255,163,0.35)] border border-emerald-400"
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
                    className={`w-full font-label-mono text-xs font-bold py-3.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                      selfReady
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(0,255,163,0.3)]'
                        : 'bg-neutral-950 border border-white/5 text-white hover:border-emerald-400 hover:text-emerald-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)]'
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
                  className="w-full bg-neutral-950 border border-white/5 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 font-label-mono text-[10px] font-bold py-2.5 rounded-2xl transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]"
                >
                  {leaving ? 'Leaving...' : 'Leave Room'}
                </button>
              </div>
            ) : (
              <button
                disabled={joining}
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold py-3.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-[-4px_-4px_12px_rgba(255,255,255,0.05),_6px_6px_16px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,255,163,0.35)] border border-emerald-400"
              >
                <span className="material-symbols-outlined font-bold">group_add</span>
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
          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)] space-y-4">
            <h4 className="font-display text-xs font-bold text-white uppercase">Invite Cohorts</h4>

            {/* Invite Code */}
            {room.invite_code && (
              <div className="space-y-1.5">
                <label className="font-label-mono text-[9px] text-emerald-300/80 uppercase font-bold block text-left">Room Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={room.invite_code}
                    className="flex-1 bg-neutral-950 border border-emerald-500/40 rounded-2xl px-3.5 py-2 font-mono text-xs text-emerald-400 focus:outline-none uppercase text-center font-bold tracking-widest shadow-[inset_3px_3px_8px_rgba(0,0,0,0.9),_inset_-3px_-3px_8px_rgba(255,255,255,0.03)]"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(room.invite_code || '');
                      setAlertMsg({ type: 'success', text: `Room code ${room.invite_code} copied!` });
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-[10px] font-extrabold px-4 rounded-2xl transition-all cursor-pointer shadow-[-3px_-3px_8px_rgba(255,255,255,0.05),_4px_4px_12px_rgba(0,0,0,0.8)] hover:scale-105"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Chat Panel with Claymorphic & Neumorphic styling */}
          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/5 shadow-[-8px_-8px_20px_rgba(255,255,255,0.02),_8px_8px_24px_rgba(0,0,0,0.85),_inset_1px_1px_1px_rgba(255,255,255,0.08)] flex flex-col h-[340px]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400 animate-pulse">forum</span>
                <span>Live Chat</span>
              </h4>
              <button 
                onClick={() => setChatCollapsed(!chatCollapsed)}
                className="text-neutral-400 hover:text-white cursor-pointer"
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
                      <p className="text-emerald-300/60 uppercase tracking-tight text-center">No messages yet. Send one!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.user_id === user?.id;
                      return (
                        <div key={msg.id || index} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-emerald-500/40 bg-neutral-950 shrink-0">
                            <img alt="User avatar" className="w-full h-full object-cover" src={msg.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'} />
                          </div>
                          <div className={`max-w-[75%] rounded-2xl p-2.5 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.05),_4px_4px_10px_rgba(0,0,0,0.6)] ${
                            isMe ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/40' : 'bg-neutral-950 border border-white/5 text-neutral-200'
                          }`}>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="font-bold text-[8px] text-emerald-400 truncate max-w-[80px]">{msg.users?.name || 'Contestant'}</span>
                              {msg.users?.is_pro && (
                                <span className="text-[6px] bg-amber-500/20 border border-amber-500/50 text-amber-400 px-1 rounded font-black tracking-tighter uppercase shrink-0">
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
                    className="flex-1 bg-neutral-950 border border-emerald-500/30 rounded-2xl px-3.5 py-2 font-mono text-[10px] text-white focus:outline-none focus:border-emerald-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)]"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 font-bold text-[10px] px-3.5 py-2 rounded-2xl uppercase shadow-[-2px_-2px_6px_rgba(255,255,255,0.05),_3px_3px_8px_rgba(0,0,0,0.8)] hover:scale-105 cursor-pointer"
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
        <span>CRONOBASH SYSTEM STAKES © 2026</span>
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
