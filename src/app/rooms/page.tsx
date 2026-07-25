"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase, Room } from '@/lib/supabaseClient';

export default function RoomsLobby() {
  const { user, wallet, refreshWallet } = useAuth();
  const router = useRouter();

  // Rooms lists
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private' | 'money'>('all');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);

  // Create Room modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private' | 'money'>('public');
  const [newRoomLimit, setNewRoomLimit] = useState(10);
  const [newRoomFee, setNewRoomFee] = useState(50);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomTags, setNewRoomTags] = useState('Engineering');
  const [creating, setCreating] = useState(false);

  // Message alert state
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Fetch rooms from Supabase
  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      // Auto-cleanup empty public rooms older than 3 hours
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      const { data: oldPublicRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('type', 'public')
        .lt('created_at', threeHoursAgo);

      if (oldPublicRooms && oldPublicRooms.length > 0) {
        const oldRoomIds = oldPublicRooms.map(r => r.id);
        const { data: memberCounts } = await supabase
          .from('room_members')
          .select('room_id')
          .in('room_id', oldRoomIds);

        const activeRoomsSet = new Set(memberCounts?.map(m => m.room_id) || []);
        const emptyRoomIds = oldRoomIds.filter(id => !activeRoomsSet.has(id));

        if (emptyRoomIds.length > 0) {
          await supabase
            .from('rooms')
            .delete()
            .in('id', emptyRoomIds);
        }
      }

      // Purge any stale test money rooms (e.g. edede money match) from Supabase
      await supabase.from('rooms').delete().eq('type', 'money');

      // Load active rooms list (Public & Private)
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .neq('type', 'money')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms(data as Room[]);
        setFilteredRooms(data as Room[]);
      }
    } catch (e) {
      console.error("Error loading/cleaning rooms:", e);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Trigger filters
  useEffect(() => {
    let result = rooms;

    if (activeFilter !== 'all') {
      result = result.filter(r => r.type === activeFilter);
    }

    if (searchQuery.trim() !== '') {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredRooms(result);
  }, [searchQuery, activeFilter, rooms]);

  // Join room operation
  const handleJoinRoom = async (room: Room) => {
    if (!user) return;
    setAlertMsg(null);

    if (room.is_active === false) {
      setAlertMsg({ type: 'error', text: 'Match in progress! This public study room is currently locked.' });
      return;
    }

    try {
      // 1. If money room, check wallet stakes and join via atomic RPC
      if (room.type === 'money') {
        setAlertMsg({ type: 'error', text: '⚡ Real-Money Cash Matches escrow is COMING SOON! Get early access notifications on your Dashboard.' });
        return;
      }

      // 2. Insert user into room members (for non-money rooms)
      const { error: joinError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          total_focus_seconds_today: 0
        });

      // If already a member (duplicate key), redirect anyway
      if (joinError && !joinError.message.includes('duplicate key')) {
        setAlertMsg({ type: 'error', text: 'Could not register room join state.' });
        return;
      }

      router.push(`/rooms/${room.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode || !user) return;
    if (cleanCode.length !== 6) {
      setAlertMsg({ type: 'error', text: 'Invite code must be exactly 6 characters.' });
      return;
    }
    setJoiningByCode(true);
    setAlertMsg(null);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .ilike('invite_code', cleanCode)
        .maybeSingle();

      if (roomError || !roomData) {
        setAlertMsg({ type: 'error', text: 'Room not found for the entered invite code.' });
        setJoiningByCode(false);
        return;
      }

      await handleJoinRoom(roomData as Room);
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred while joining the room.' });
    } finally {
      setJoiningByCode(false);
    }
  };

  // Create room handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    setCreating(true);
    setAlertMsg(null);

    // Limit validations based on room type
    if (newRoomType === 'money' && (newRoomLimit < 2 || newRoomLimit > 6)) {
      setAlertMsg({ type: 'error', text: 'Money rooms must have a maximum capacity of 2 to 6 contestants.' });
      setCreating(false);
      return;
    }
    if ((newRoomType === 'public' || newRoomType === 'private') && (newRoomLimit < 2 || newRoomLimit > 10)) {
      setAlertMsg({ type: 'error', text: 'Public or private rooms must have a maximum capacity of 2 to 10 contestants.' });
      setCreating(false);
      return;
    }

    const tagsArray = newRoomTags.split(',').map(t => t.trim()).filter(Boolean);

    // Block money room creation completely until official launch
    if (newRoomType === 'money') {
      setAlertMsg({ 
        type: 'error', 
        text: '⚡ Money Arenas creation is COMING SOON! Real-money cash contests & token escrow are undergoing final security audits. Please select Public or Private Arena for now.' 
      });
      setCreating(false);
      return;
    }

    try {
      // Ensure user profile exists in public.users to prevent foreign key fkey violations!
      const { data: profileCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileCheck) {
        await supabase.from('users').insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Contestant',
          email: user.email || '',
          daily_goal_minutes: 120
        });
      }

      const { data: walletCheck } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!walletCheck) {
        await supabase.from('wallets').insert({
          user_id: user.id,
          balance: 0
        });
      }

      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName.trim(),
          type: newRoomType,
          owner_id: user.id,
          max_members: newRoomLimit,
          entry_fee: 0,
          platform_fee_percent: 10,
          subject_tags: tagsArray,
          description: newRoomDescription.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (roomError || !newRoom) {
        setAlertMsg({ type: 'error', text: roomError?.message || 'Error generating new study room instance.' });
        setCreating(false);
        return;
      }

      // Add owner as member
      const { error: joinError } = await supabase
        .from('room_members')
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          total_focus_seconds_today: 0
        });

      if (joinError) {
        setAlertMsg({ type: 'error', text: 'Room created, but auto-join failed.' });
      }

      setIsModalOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      router.push(`/rooms/${newRoom.id}`);
    } catch (e) {
      console.error(e);
      setAlertMsg({ type: 'error', text: e instanceof Error ? e.message : 'An unexpected error occurred.' });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadRooms();
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('kicked') === 'true') {
        setAlertMsg({ type: 'error', text: 'You were kicked from the study arena by the owner.' });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Lobbies controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-surface-container p-6 rounded-3xl shadow-[0_0_30px_rgba(0,255,163,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,163,0.3)]">
              LIVE ARENA NETWORK
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">
            Study Arenas Hub
          </h2>
          <p className="text-xs text-emerald-300/80 font-mono mt-0.5">Join live study arenas or stake tokens in high-stakes money contests</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold py-3 px-6 rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,163,0.4)] cursor-pointer border border-emerald-400"
        >
          <span className="material-symbols-outlined text-sm font-bold animate-spin">add</span>
          Create Arena
        </button>
      </div>

      {alertMsg && (
        <div className={`border rounded-2xl p-4 text-xs flex items-center gap-3 font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
          alertMsg.type === 'error' ? 'bg-rose-500/15 border-rose-500/50 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
        }`}>
          <span className="material-symbols-outlined text-sm animate-bounce">warning</span>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-surface-container border border-emerald-500/30 p-4 rounded-2xl shadow-[0_0_20px_rgba(0,255,163,0.1)]">
        {/* Type Filter buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'public', 'private', 'money'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 rounded-xl font-label-mono text-xs font-bold uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-neutral-950 font-extrabold shadow-[0_0_15px_rgba(0,255,163,0.4)] scale-105 border border-emerald-400'
                  : 'bg-neutral-950/80 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-emerald-500/20'
              }`}
            >
              <span>{filter === 'money' ? 'Money Arenas' : filter}</span>
              {filter === 'money' && (
                <span className="text-[8px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                  COMING SOON
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Join by Code & Search Container */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Join by Code form */}
          <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().trim())}
              placeholder="ENTER ARENA CODE..."
              className="bg-neutral-950 border border-emerald-500/30 rounded-xl px-3.5 py-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-400 uppercase tracking-wider w-full sm:w-40 text-center"
            />
            <button
              type="submit"
              disabled={joiningByCode}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-neutral-950 font-label-mono text-[10px] font-extrabold px-4 py-2 rounded-xl transition-all hover:scale-105 cursor-pointer shrink-0 uppercase shadow-[0_0_10px_rgba(0,229,255,0.3)]"
            >
              {joiningByCode ? 'Joining...' : 'Join Code'}
            </button>
          </form>

          {/* Search Input bar */}
          <div className="w-full sm:w-48 relative flex items-center bg-neutral-950 border border-emerald-500/30 rounded-xl px-3.5 py-2">
            <span className="material-symbols-outlined text-emerald-400 text-lg mr-2 select-none animate-pulse">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study arenas..."
              className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Rooms Grid list or Money Arenas Full-Page COMING SOON */}
      {activeFilter === 'money' ? (
        <div className="card-base p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <span className="material-symbols-outlined text-2xl font-bold">payments</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              OFFICIAL FEATURE PREVIEW
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight">
              High-Stakes Money Matches & Cash Contests
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant font-mono max-w-xl mx-auto leading-relaxed">
              Master cognitive discipline, eliminate distractions, and stake your focus in 1v1 skill-verified study duels.
            </p>
          </div>

          {/* Large Ripped Paper Reveal "COMING SOON" Graphic Container */}
          <div className="w-full max-w-lg mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-0.5 select-none">
            <div className="py-6 sm:py-8 px-6 sm:px-10 flex items-center justify-center bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 relative">
              {/* Curled / Ripped White Paper Fold Effect */}
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-gradient-to-r from-neutral-100 via-neutral-300 to-transparent shadow-[4px_0_12px_rgba(0,0,0,0.8)] transform -skew-x-6 border-r border-neutral-400 pointer-events-none z-20" />
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-3 bg-gradient-to-r from-neutral-400 to-transparent opacity-40 z-20 pointer-events-none" />

              {/* Metallic 3D Silver "COMING SOON" Typography */}
              <div className="relative z-10 text-center font-black tracking-widest uppercase font-display">
                <span className="block text-2xl sm:text-4xl md:text-5xl bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]">
                  COMING SOON
                </span>
              </div>
            </div>
          </div>

          {/* Trust-Building Psychological Notice */}
          <div className="bg-surface-container-high/60 border border-outline-variant/30 rounded-2xl p-5 text-left space-y-1.5 max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
              <span className="material-symbols-outlined text-sm text-emerald-400">verified_user</span>
              <span>100% Skill-Verified Cognitive Esports Standard</span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
              Match outcomes are strictly determined by human focus verified frame-by-frame by MediaPipe AI gaze algorithms for peak academic mastery.
            </p>
          </div>
        </div>
      ) : loadingRooms ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-label-mono text-xs mt-4">FETCHING ACTIVE ARENAS...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="card-base text-center py-20 space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">meeting_room</span>
          <p className="text-sm font-label-mono text-on-surface-variant">No active study arenas found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isMoneyRoom = room.type === 'money';
            return (
              <div 
                key={room.id}
                className="card-base flex flex-col justify-between p-6 relative overflow-hidden group bg-gradient-to-br from-emerald-500/15 via-cyan-500/5 to-surface-container border border-emerald-500/40 hover:border-cyan-400 rounded-3xl transition-all duration-300 shadow-[0_0_20px_rgba(0,255,163,0.15)] hover:shadow-[0_0_35px_rgba(0,255,163,0.3)] hover:-translate-y-1"
              >
                {/* Background Ambient Glow Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/25 transition-all"></div>
                
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-label-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        isMoneyRoom 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                          : room.type === 'private' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,163,0.3)]'
                      }`}>
                        {room.type} Arena
                      </span>
                      {isMoneyRoom && (
                        <span className="font-label-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                          COMING SOON
                        </span>
                      )}
                      {room.is_active === false && !isMoneyRoom && (
                        <span className="font-label-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] animate-pulse">lock</span>
                          MATCH IN PROGRESS
                        </span>
                      )}
                    </div>
                    {isMoneyRoom && (
                      <span className="font-label-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                        <span className="material-symbols-outlined text-[12px] font-bold">attach_money</span>
                        Buy-in: {room.entry_fee} TKN
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-xl font-black text-white mb-2 truncate group-hover:text-cyan-400 transition-colors tracking-tight">
                    {room.name}
                  </h3>
                  
                  <p className="text-xs text-emerald-300/80 font-mono line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
                    {room.description || 'Join this study arena to sprint focus timers together, share resources, and climb daily metrics.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {room.subject_tags.map(tag => (
                      <span key={tag} className="font-label-mono text-[9px] bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-md text-emerald-300 font-bold shadow-[0_0_6px_rgba(0,255,163,0.15)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-emerald-500/20 pt-4 flex items-center justify-between relative z-10">
                  <div className="flex flex-col gap-1 font-label-mono text-xs text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm animate-pulse text-emerald-400">groups</span>
                      <span className="font-bold">Max: {room.max_members} spots</span>
                    </div>
                    {room.invite_code && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(room.invite_code || '');
                          setAlertMsg({ type: 'success', text: `Arena code ${room.invite_code} copied to clipboard!` });
                        }}
                        className="text-[10px] text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-md cursor-pointer transition-all w-fit select-none font-bold font-mono tracking-wider mt-1 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                        title="Click to copy code"
                      >
                        CODE: {room.invite_code}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={room.is_active === false || isMoneyRoom}
                    onClick={() => handleJoinRoom(room)}
                    className={`font-label-mono text-[10px] font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer uppercase ${
                      isMoneyRoom
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-not-allowed opacity-90'
                        : room.is_active === false
                          ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:scale-105 border border-emerald-400'
                    }`}
                  >
                    {isMoneyRoom ? 'COMING SOON 🔒' : room.is_active === false ? 'LOCKED 🔒' : 'Enter Arena'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Room modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className="w-full max-w-lg bg-surface-container border border-outline-variant rounded-2xl p-8 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-lg font-black text-on-surface uppercase">Configure Focus Arena</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Arena Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Deep Work: Engineering"
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 font-label-mono text-sm text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Arena Type</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as ('public' | 'private' | 'money'))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-fixed"
                  >
                    <option value="public">Public Arena</option>
                    <option value="private">Private Arena</option>
                    <option value="money">Money Match (COMING SOON)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Max Members</label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={newRoomLimit}
                    onChange={(e) => setNewRoomLimit(parseInt(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {newRoomType === 'money' && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs font-display flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-amber-400">warning</span>
                      <span>Money Arena Launch Notice</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed font-mono">
                    ⚡ Money Arena creation is currently locked. Real-money token escrow & cash contests are undergoing final security audits. Please select Public or Private Arena to initialize your study room.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newRoomTags}
                  onChange={(e) => setNewRoomTags(e.target.value)}
                  placeholder="e.g. Engineering, Code, Math"
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 font-label-mono text-sm text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div>
                <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Description</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Focus sprint guidelines..."
                  rows={3}
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating || newRoomType === 'money'}
                className={`w-full font-label-mono text-xs font-bold py-3.5 rounded-lg transition-colors mt-4 cursor-pointer ${
                  newRoomType === 'money'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-not-allowed opacity-90'
                    : 'bg-primary-container hover:bg-primary-fixed text-on-primary shadow-[0_0_12px_rgba(0,255,163,0.2)]'
                }`}
              >
                {creating ? 'Spawning Instance...' : newRoomType === 'money' ? 'Money Arenas Coming Soon 🔒' : 'Initialize Study Arena'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
