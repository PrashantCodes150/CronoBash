"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import LogoLoader from '@/components/LogoLoader';
import { supabase, Room } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function RoomsLobby() {
  const { user, wallet, refreshWallet } = useAuth();
  const router = useRouter();

  // Rooms lists
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Filters & Search & Dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private' | 'money'>('all');
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);

  // Create Room modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private' | 'money'>('public');
  const [newRoomLimit, setNewRoomLimit] = useState(10);
  const [newRoomFee, setNewRoomFee] = useState(50);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomTags, setNewRoomTags] = useState('Engineering, Math');
  const [creating, setCreating] = useState(false);

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

      // Purge any stale test money rooms
      await supabase.from('rooms').delete().eq('type', 'money');

      // Load active rooms list
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
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.subject_tags && r.subject_tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    setFilteredRooms(result);
  }, [activeFilter, searchQuery, rooms]);

  // Quick Auto Join Public Room
  const handleQuickMatch = () => {
    const publicRooms = rooms.filter(r => r.type === 'public');
    if (publicRooms.length > 0) {
      toast.success(`Joining active arena: "${publicRooms[0].name}" 🚀`);
      router.push(`/rooms/${publicRooms[0].id}`);
    } else {
      setIsModalOpen(true);
      toast.error('No open public rooms right now. Host a new arena!');
    }
  };

  // Join Room By Invite Code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoiningByCode(true);

    try {
      const { data: targetRoom, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('invite_code', joinCodeInput.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !targetRoom) {
        toast.error('Invalid or expired Arena Invite Code.');
        setJoiningByCode(false);
        return;
      }

      toast.success(`Joining private arena: "${targetRoom.name}" 🚀`);
      router.push(`/rooms/${targetRoom.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Error verifying invite code.');
    } finally {
      setJoiningByCode(false);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Invite code "${code}" copied to clipboard! 📋`);
  };

  // Delete Hosted Arena
  const handleDeleteHostedRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('owner_id', user?.id || '');

      if (!error) {
        toast.success('Hosted Arena deleted successfully.');
        setRooms(prev => prev.filter(r => r.id !== roomId));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete room.');
    }
  };

  // Create Room submit handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;

    setCreating(true);

    const tagsArray = newRoomTags.split(',').map(t => t.trim()).filter(Boolean);

    if (newRoomType === 'money') {
      toast.error('⚡ Money Arenas creation is COMING SOON! High-stakes skill escrow is in final security audit.');
      setCreating(false);
      return;
    }

    try {
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
        toast.error(roomError?.message || 'Error generating new study room instance.');
        setCreating(false);
        return;
      }

      await supabase
        .from('room_members')
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          total_focus_seconds_today: 0
        });

      toast.success('Arena Created! Launching Lobby... 🚀');
      setIsModalOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      router.push(`/rooms/${newRoom.id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadRooms();
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('kicked') === 'true') {
        toast.error('You were kicked from the study arena by the owner.');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const publicRoomsCount = rooms.filter(r => r.type === 'public').length;
  const privateRoomsCount = rooms.filter(r => r.type === 'private').length;
  const myHostedRooms = rooms.filter(r => r.owner_id === user?.id);

  // Rainbow Tag Colors helper
  const getTagColorClass = (idx: number) => {
    const colors = [
      'bg-blue-50 text-[#3B82F6] border-blue-200',
      'bg-emerald-50 text-[#10B981] border-emerald-200',
      'bg-purple-50 text-[#8B5CF6] border-purple-200',
      'bg-amber-50 text-[#D97706] border-amber-200',
      'bg-rose-50 text-[#E11D48] border-rose-200'
    ];
    return colors[idx % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#fafaf9] min-h-screen text-[#1c1917] font-sans p-4 sm:p-6 md:p-8 rounded-[32px] space-y-6 select-none pb-24 lg:pb-8"
    >
      
      {/* ── TOP NAVIGATION & FILTER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Title & Location Dropdown Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-white/80 flex items-center gap-2 cursor-pointer hover:shadow transition-all group"
            >
              <span className="font-extrabold text-sm text-slate-900">Squad Arenas Hub</span>
              <span className={`material-symbols-outlined text-slate-400 text-base transition-transform ${isNavDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Dropdown Overlay */}
            {isNavDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNavDropdownOpen(false)}></div>
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-40 animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Arena Categories
                  </div>
                  <ul className="space-y-1 pt-1 text-xs font-bold text-slate-700">
                    <li>
                      <button
                        onClick={() => { setActiveFilter('all'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#3B82F6]">dashboard</span>
                        <span>All Active Arenas</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveFilter('public'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#10B981]">groups</span>
                        <span>Public Focus Lobbies</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveFilter('private'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#8B5CF6]">lock</span>
                        <span>Private Squad Duels</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveFilter('money'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#F59E0B]">payments</span>
                        <span>High-Stakes Cash Contests</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar py-1 w-full sm:w-auto max-w-full">
            {[
              { id: 'all', label: `All Arenas (${rooms.length})` },
              { id: 'public', label: `Public (${publicRoomsCount})` },
              { id: 'private', label: `Private (${privateRoomsCount})` },
              { id: 'money', label: 'Money Matches' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <button
            onClick={handleQuickMatch}
            className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-sm border border-white/80 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base text-[#10B981]">flash_on</span>
            <span>Quick Match</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Host Arena</span>
          </button>
        </div>
      </div>

      {/* ── TOP STATS WIDGETS ROW (4 COLUMNS WITH VIBRANT BADGES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Widget 1: Total Active Arenas */}
        <div 
          onClick={() => setActiveFilter('all')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#3B82F6] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">meeting_room</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Lobbies</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{rooms.length} Running</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#3B82F6] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Network
          </span>
        </div>

        {/* Widget 2: Public Focus Lobbies */}
        <div 
          onClick={() => setActiveFilter('public')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#10B981] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">groups</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Public Lobbies</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{publicRoomsCount} Open</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
          </span>
        </div>

        {/* Widget 3: Private Squad Rooms */}
        <div 
          onClick={() => setActiveFilter('private')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#8B5CF6] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">lock</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Private Squads</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{privateRoomsCount} Locked</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#8B5CF6] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Invite
          </span>
        </div>

        {/* Widget 4: Hosted By You */}
        <div className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#F59E0B] transition-all shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] text-gray-900 flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined text-xl font-bold">star</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hosted By You</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{myHostedRooms.length} Arenas</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Owner
          </span>
        </div>

      </div>

      {/* ── MAIN CONTENT GRID (12 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ROOMS GRID & SEARCH (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Search & Title Bar */}
          <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-base font-bold">search</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Explore Active Arenas</h3>
            </div>

            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
              <span className="material-symbols-outlined text-slate-400 text-base mr-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by arena name or tag..."
                className="bg-transparent text-slate-900 focus:outline-none w-full sm:w-56 font-medium"
              />
            </div>
          </div>

          {/* Rooms Grid list */}
          {activeFilter === 'money' ? (
            <div className="morphism-card bg-white p-8 md:p-10 text-center space-y-6 rounded-[28px] border border-amber-200 shadow-sm animate-fadeIn">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#F59E0B] text-gray-900 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-3xl font-bold">payments</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-4 py-1 rounded-full">
                  OFFICIAL FEATURE PREVIEW
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  High-Stakes Money Matches &amp; Cash Contests
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                  Master cognitive discipline, eliminate distractions, and stake your focus in 1v1 skill-verified study duels.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-1.5 max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>100% Skill-Verified Cognitive Standard</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Match outcomes are strictly determined by human focus verified frame-by-frame by MediaPipe AI gaze algorithms for peak academic mastery.
                </p>
              </div>
            </div>
          ) : loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[28px] border border-white/80">
              <LogoLoader size="md" text="FETCHING ACTIVE ARENAS..." />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="morphism-card bg-white text-center py-20 space-y-4 rounded-[28px] border border-white/80">
              <span className="material-symbols-outlined text-5xl text-slate-300">meeting_room</span>
              <p className="text-sm font-bold text-slate-500">No active study arenas found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#1D1D1F] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-sm"
              >
                + Host New Arena
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeIn">
              {filteredRooms.map((room) => {
                const isPrivate = room.type === 'private';
                return (
                  <div 
                    key={room.id}
                    className={`morphism-card bg-white flex flex-col justify-between p-6 relative overflow-hidden group rounded-[28px] transition-all duration-200 shadow-sm hover:shadow-md border ${
                      isPrivate ? 'border-purple-200/80 hover:border-[#8B5CF6]' : 'border-blue-200/80 hover:border-[#3B82F6]'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                          isPrivate ? 'bg-purple-50 text-[#8B5CF6] border-purple-200' : 'bg-emerald-50 text-[#059669] border-emerald-200'
                        }`}>
                          {room.type} Arena
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#3B82F6]">group</span>
                          {room.max_members} max
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#3B82F6] transition-colors">
                          {room.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                          {room.description || 'Focus study room for high achievers.'}
                        </p>
                      </div>

                      {room.subject_tags && room.subject_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.subject_tags.map((tag, idx) => (
                            <span key={tag} className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${getTagColorClass(idx)}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                        <span>Code:</span>
                        <span className="text-slate-800 font-mono font-bold select-all">{room.invite_code || 'PUBLIC'}</span>
                        {room.invite_code && (
                          <button
                            onClick={(e) => handleCopyCode(room.invite_code || '', e)}
                            className="text-[#3B82F6] hover:text-blue-700 p-0.5 cursor-pointer"
                            title="Copy Invite Code"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => router.push(`/rooms/${room.id}`)}
                        className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-transform hover:scale-105 cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <span>Enter Lobby</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: QUICK JOIN & YOUR HOSTED ARENAS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Join By Invite Code Widget */}
          <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#8B5CF6] font-bold">vpn_key</span>
              <h3 className="font-extrabold text-sm text-slate-900">
                Quick Join By Code
              </h3>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">Enter a 6-character private invite code to join a friend's locked arena:</p>
              <input
                type="text"
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().trim())}
                placeholder="ENTER CODE..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#8B5CF6] uppercase tracking-wider text-center"
              />
              <button
                type="submit"
                disabled={joiningByCode}
                className="w-full bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md disabled:opacity-50"
              >
                {joiningByCode ? 'Verifying Code...' : 'Join Private Lobby 🚀'}
              </button>
            </form>
          </div>

          {/* Your Hosted Arenas Quick Access Widget */}
          <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] font-bold">star</span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Your Hosted Arenas
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">{myHostedRooms.length} active</span>
            </div>

            {myHostedRooms.length === 0 ? (
              <div className="p-6 border border-slate-100 rounded-2xl text-center bg-slate-50 space-y-2">
                <p className="text-xs text-slate-400 font-medium">You have not created any lobbies yet.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#F59E0B] text-gray-900 text-xs font-bold px-4 py-1.5 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-sm"
                >
                  + Host Arena
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myHostedRooms.map(room => (
                  <div key={room.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{room.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">Code: {room.invite_code || 'PUBLIC'}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => router.push(`/rooms/${room.id}`)}
                        className="bg-[#1D1D1F] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg hover:bg-black cursor-pointer"
                      >
                        Enter
                      </button>
                      <button
                        onClick={(e) => handleDeleteHostedRoom(room.id, e)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete Arena"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Host New Study Arena
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Arena Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Quantum Physics Sprint"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Arena Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewRoomType(type)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        newRoomType === type
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={newRoomLimit}
                  onChange={(e) => setNewRoomLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newRoomTags}
                  onChange={(e) => setNewRoomTags(e.target.value)}
                  placeholder="e.g. Engineering, Math, Code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="What are you studying?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Arena 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
