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
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms(data as Room[]);
        setFilteredRooms(data as Room[]);
      }
    } catch (e) {
      console.error(e);
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

    try {
      // 1. If money room, check wallet stakes and join via atomic RPC
      if (room.type === 'money') {
        const { data: joinRes, error: rpcError } = await supabase
          .rpc('join_money_room', { p_user_id: user.id, p_room_id: room.id });

        if (rpcError || (joinRes && joinRes.error)) {
          const errMsg = rpcError?.message || joinRes?.error || 'Staking transaction failed.';
          setAlertMsg({ type: 'error', text: errMsg });
          return;
        }

        await refreshWallet();
        router.push(`/rooms/${room.id}`);
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

  // Create room handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    setCreating(true);
    setAlertMsg(null);

    const tagsArray = newRoomTags.split(',').map(t => t.trim());

    try {
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName.trim(),
          type: newRoomType,
          owner_id: user.id,
          max_members: newRoomLimit,
          entry_fee: newRoomType === 'money' ? newRoomFee : 0,
          platform_fee_percent: 10,
          subject_tags: tagsArray,
          description: newRoomDescription.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (roomError || !newRoom) {
        setAlertMsg({ type: 'error', text: 'Error generating new study room instance.' });
        setCreating(false);
        return;
      }

      // Add owner as first member
      await supabase.from('room_members').insert({
        room_id: newRoom.id,
        user_id: user.id,
        total_focus_seconds_today: 0
      });

      setIsModalOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      router.push(`/rooms/${newRoom.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Lobbies controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Study Lobbies</h2>
          <p className="text-xs text-on-surface-variant mt-1">Join study rooms or stake tokens in high-stakes money contests</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-container text-on-primary font-label-mono text-xs font-bold py-2.5 px-6 rounded-lg hover:bg-primary-fixed transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,163,0.2)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Create Room
        </button>
      </div>

      {alertMsg && (
        <div className={`border rounded-lg p-4 text-xs flex items-center gap-3 ${
          alertMsg.type === 'error' ? 'bg-error-container/15 border-error/50 text-error' : 'bg-primary-container/15 border-primary-container/50 text-primary-fixed'
        }`}>
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-container-low border border-outline-variant p-4 rounded-xl">
        {/* Type Filter buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'public', 'private', 'money'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg font-label-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-primary-container text-on-primary font-bold shadow-[0_0_10px_rgba(0,255,163,0.2)]'
                  : 'bg-background hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="w-full md:max-w-xs relative flex items-center bg-background border border-outline-variant rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-on-surface-variant text-lg mr-2 select-none">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study squads..."
            className="w-full bg-transparent text-xs text-on-surface focus:outline-none"
          />
        </div>
      </div>

      {/* Rooms Grid list */}
      {loadingRooms ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-label-mono text-xs mt-4">FETCHING ACTIVE LOBBIES...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="card-base text-center py-20 space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">meeting_room</span>
          <p className="text-sm font-label-mono text-on-surface-variant">No active study lobbies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isMoneyRoom = room.type === 'money';
            return (
              <div 
                key={room.id}
                className="card-base flex flex-col justify-between p-6 relative overflow-hidden group hover:neon-glow-active transition-all duration-300"
              >
                {/* Neon glow elements for money rooms */}
                {isMoneyRoom && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed/5 rounded-full blur-2xl"></div>
                )}
                
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className={`font-label-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isMoneyRoom 
                        ? 'bg-primary-container/10 text-primary-fixed border border-primary-container/30' 
                        : room.type === 'private' 
                          ? 'bg-secondary-container/10 text-secondary-fixed border border-secondary-container/30'
                          : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {room.type} Room
                    </span>
                    {isMoneyRoom && (
                      <span className="font-label-mono text-[10px] text-primary-fixed font-bold bg-primary-container/15 px-2 py-0.5 rounded flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] font-bold">attach_money</span>
                        Buy-in: {room.entry_fee} TKN
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold text-on-surface mb-2 truncate group-hover:text-primary-fixed transition-colors">
                    {room.name}
                  </h3>
                  
                  <p className="text-xs text-on-surface-variant line-clamp-2 min-h-[32px] mb-4">
                    {room.description || 'Join this study squad to sprint focus timers together, share resources, and climb daily metrics.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {room.subject_tags.map(tag => (
                      <span key={tag} className="font-label-mono text-[9px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-outline-variant/30 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-label-mono text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">groups</span>
                    <span>Max: {room.max_members} spots</span>
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room)}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[10px] font-bold px-4 py-2 rounded-lg transition-colors shadow-[0_0_8px_rgba(0,255,163,0.15)] cursor-pointer"
                  >
                    {isMoneyRoom ? `Stake & Join` : 'Enter Room'}
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
              <h3 className="font-display text-lg font-black text-on-surface uppercase">Configure Focus Room</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Room Name</label>
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
                  <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Room Type</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-fixed"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="money">Money Room</option>
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
                <div>
                  <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase font-bold">Entry Fee Stake (TKN)</label>
                  <input
                    type="number"
                    min={10}
                    value={newRoomFee}
                    onChange={(e) => setNewRoomFee(parseInt(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-fixed"
                  />
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
                disabled={creating}
                className="w-full bg-primary-container text-on-primary font-label-mono text-xs font-bold py-3.5 rounded-lg hover:bg-primary-fixed transition-colors mt-4 cursor-pointer"
              >
                {creating ? 'Spawning Instance...' : 'Initialize Study Room'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
