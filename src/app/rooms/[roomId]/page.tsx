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
      // 1. Try to fetch leaderboard via SQL RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_room_leaderboard', { p_room_id: roomId });

      if (!rpcError && rpcData) {
        const formatted = rpcData.map((row: any) => ({
          id: row.user_id,
          room_id: roomId,
          user_id: row.user_id,
          joined_at: row.joined_at,
          total_focus_seconds_today: row.focus_seconds_today,
          users: {
            id: row.user_id,
            name: row.user_name,
            avatar_url: row.avatar_url,
            email: ''
          }
        }));
        setMembers(formatted);
        return;
      }

      // 2. Fallback query
      const { data, error } = await supabase
        .from('room_members')
        .select('*, users:user_id(*)')
        .eq('room_id', roomId)
        .order('total_focus_seconds_today', { ascending: false });

      if (!error && data) {
        setMembers(data as any[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch chat messages
  const loadRoomMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, users:user_id(name, avatar_url)')
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
      await Promise.all([loadRoomInfo(), loadRoomMembers(), loadRoomMessages()]);
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
            .select('name, avatar_url')
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
                  </tr>
                </thead>
                <tbody className="font-mono text-xs text-on-surface">
                  {members.map((mbr, idx) => {
                    const isCurrentUser = mbr.user_id === user?.id;
                    const name = mbr.users?.name || 'Arena Fighter';
                    const avatar = mbr.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150';
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
                            <span className={`font-mono text-xs ${isCurrentUser ? 'text-primary-fixed font-bold' : 'text-on-surface'}`}>
                              {name} {isCurrentUser && '(You)'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-bold text-on-surface-variant">
                          <span className={isCurrentUser ? 'text-primary-fixed font-bold' : ''}>
                            {formatSeconds(mbr.total_focus_seconds_today)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rules Section */}
          <section className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Rig Enforcement Rules</h3>
            <ul className="space-y-4 font-sans text-xs text-on-surface-variant">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-fixed text-lg shrink-0">videocam</span>
                <div>
                  <p className="font-bold text-on-surface">Webcam Verification Mode</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed">Active webcam streams assess eyes, posture, and facial zone parameters. Distractions cause immediate multipliers lock.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-fixed text-lg shrink-0">mic_off</span>
                <div>
                  <p className="font-bold text-on-surface">Absolute Silence</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed">Keep mic streams disabled to ensure pure workspace concentration.</p>
                </div>
              </li>
              {isMoneyRoom && (
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-lg shrink-0">warning</span>
                  <div>
                    <p className="font-bold text-error">Stakes Conditions</p>
                    <p className="text-[10px] text-error/80 mt-0.5 leading-relaxed">Platform payout resets at 00:00 UTC. Prize pool is split among top percentile focus performers. Stakes fees are non-refundable.</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* Right Column: Room details & Stakes information */}
        <div className="lg:col-span-4 space-y-6">
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

            {members.some(m => m.user_id === user?.id) ? (
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/study?roomId=${roomId}`)}
                  className="w-full bg-primary-container text-on-primary font-label-mono text-xs font-bold py-3.5 rounded-xl hover:bg-primary-fixed transition-all hover:scale-[1.02] glow-primary flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  Launch Study Sprint
                </button>
                <button
                  disabled={leaving}
                  onClick={handleLeaveRoom}
                  className="w-full bg-surface-container-high border border-outline-variant text-on-surface hover:text-error hover:border-error font-label-mono text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
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
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/rooms/${roomId}` : ''}
                className="flex-1 bg-background border border-outline-variant rounded-lg px-3 py-2 font-mono text-[10px] text-on-surface-variant focus:outline-none focus:border-primary-fixed"
              />
              <button 
                onClick={copyInviteLink}
                className="bg-surface-container-high hover:bg-surface-container border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-[10px] px-3.5 rounded-lg transition-all cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
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
                            <p className="font-bold text-[8px] opacity-70 mb-0.5 truncate">{msg.users?.name || 'Contestant'}</p>
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
    </div>
  );
}
