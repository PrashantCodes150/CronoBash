"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import LogoLoader from '@/components/LogoLoader';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function BuddiesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);

  // Tab Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending' | 'global'>('all');
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [buddySearchInput, setBuddySearchInput] = useState('');

  // Connection states
  const [buddies, setBuddies] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Global directory & invite states
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  // Quick Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickConnectInput, setQuickConnectInput] = useState('');

  // 1v1 Challenge Modal state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeTargetBuddy, setChallengeTargetBuddy] = useState<any | null>(null);
  const [challengeTitle, setChallengeTitle] = useState('1v1 Focus Duel');
  const [challengeDuration, setChallengeDuration] = useState(25);
  const [challengeStake, setChallengeStake] = useState(0);
  const [sendingChallenge, setSendingChallenge] = useState(false);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const { data: conns, error } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;
      if (!conns) return;

      const otherUserIds = Array.from(new Set(
        conns.map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id)
      ));

      let profilesMap: Record<string, any> = {};
      if (otherUserIds.length > 0) {
        const { data: profiles, error: profError } = await supabase
          .from('users')
          .select('id, name, full_name, username, gamer_tag, avatar_url, level, points, last_seen_at')
          .in('id', otherUserIds);
        if (!profError && profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const tempBuddies: any[] = [];
      const tempPending: any[] = [];

      conns.forEach(c => {
        const isSender = c.sender_id === user.id;
        const otherId = isSender ? c.receiver_id : c.sender_id;
        const otherProfile = profilesMap[otherId] || { 
          id: otherId, 
          name: 'Arena Fighter', 
          avatar_url: '', 
          email: '',
          level: 1,
          points: 0,
          last_seen_at: null
        };

        const connWithProfile = { ...c, profile: otherProfile };

        if (c.status === 'accepted') {
          tempBuddies.push(connWithProfile);
        } else if (c.status === 'pending' && !isSender) {
          tempPending.push(connWithProfile);
        }
      });

      setBuddies(tempBuddies);
      setPendingRequests(tempPending);
    } catch (e) {
      console.error("Error loading connections:", e);
    }
  };

  const handleSearchUsers = async (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    const cleanQ = q.trim().replace(/^@/, '');
    if (!cleanQ || !user) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, full_name, username, gamer_tag, avatar_url, level, points, last_seen_at')
        .or(`username.ilike.%${cleanQ}%,gamer_tag.ilike.%${cleanQ}%,name.ilike.%${cleanQ}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });

      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: receiverId,
        title: '⚡ NEW BUDDY REQUEST',
        message: `${profile?.name || 'An Arena Fighter'} sent you a squad connection request!`,
        type: 'buddy_request',
        is_read: false
      });

      toast.success('Connection request sent! 🚀');
      await loadConnections();
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
      setIsAddModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error sending request.");
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;
      toast.success('Buddy accepted to your squad! 🤝');
      await loadConnections();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error accepting request.");
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      toast.success('Connection removed.');
      await loadConnections();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error removing connection.");
    }
  };

  const loadGlobalDirectory = async () => {
    if (!user) return;
    setLoadingGlobal(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, full_name, username, gamer_tag, avatar_url, level, points, last_seen_at')
        .neq('id', user.id)
        .order('last_seen_at', { ascending: false, nullsFirst: false })
        .limit(12);

      if (!error && data) {
        setGlobalUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const loadMyRooms = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type, invite_code')
        .eq('owner_id', user.id)
        .eq('is_active', true);

      if (!error && data) {
        setMyRooms(data);
        if (data.length > 0) setSelectedRoom(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendLobbyInvite = async (targetUserId: string) => {
    if (!selectedRoom) {
      toast.error("Please create or host an arena lobby first!");
      return;
    }
    const roomObj = myRooms.find(r => r.id === selectedRoom);
    if (!roomObj) return;

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: targetUserId,
        title: '⚔️ ARENA LOBBY INVITE',
        message: `${profile?.name || 'A squad member'} invited you to join Focus Arena: "${roomObj.name}"!`,
        type: 'invite',
        is_read: false,
        metadata: {
          room_id: roomObj.id,
          invite_code: roomObj.invite_code || '',
          inviter_name: profile?.name || 'Contestant'
        }
      });

      if (error) throw error;
      toast.success("Lobby invite sent to friend! 📩");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to send lobby invite.");
    }
  };

  // Launch 1v1 Battle Challenge
  const handleLaunch1v1Challenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !challengeTargetBuddy) return;
    setSendingChallenge(true);

    try {
      const roomName = challengeTitle.trim() || `1v1 Duel vs ${challengeTargetBuddy.name}`;
      const isMoneyRoom = challengeStake > 0;

      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          type: isMoneyRoom ? 'money' : 'private',
          owner_id: user.id,
          max_members: 2,
          entry_fee: challengeStake,
          platform_fee_percent: 10,
          subject_tags: ['1v1 Battle', `${challengeDuration}m`],
          description: `Direct 1v1 Focus Duel vs ${challengeTargetBuddy.name} (${challengeDuration} mins)`,
          is_active: true
        })
        .select()
        .single();

      if (roomError || !newRoom) {
        toast.error('Failed to create duel room.');
        setSendingChallenge(false);
        return;
      }

      await supabase.from('room_members').insert({
        room_id: newRoom.id,
        user_id: user.id,
        total_focus_seconds_today: 0
      });

      await supabase.from('notifications').insert({
        user_id: challengeTargetBuddy.id,
        title: '⚔️ 1v1 BATTLE CHALLENGE!',
        message: `${profile?.name || 'A squad buddy'} challenged you to a ${challengeDuration}m 1v1 Focus Duel: "${roomName}"!`,
        type: 'invite',
        is_read: false,
        metadata: {
          room_id: newRoom.id,
          invite_code: newRoom.invite_code || '',
          challenger_id: user.id,
          challenger_name: profile?.name || 'Challenger'
        }
      });

      toast.success(`1v1 Challenge sent to ${challengeTargetBuddy.name}! Launching arena... 🚀`);
      setIsChallengeModalOpen(false);
      router.push(`/rooms/${newRoom.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error("Error creating 1v1 duel.");
    } finally {
      setSendingChallenge(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConnections().then(() => setLoading(false));
      loadGlobalDirectory();
      loadMyRooms();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#ECEFF6] rounded-[32px] p-8">
        <LogoLoader size="md" text="SYNCHRONIZING SQUAD COMMAND CENTER..." />
      </div>
    );
  }

  const onlineBuddies = buddies.filter(b => {
    const lastSeen = b.profile?.last_seen_at;
    return lastSeen && (Date.now() - new Date(lastSeen).getTime() < 180000);
  });

  const filteredBuddiesList = buddies.filter(b => {
    if (activeTab === 'online') {
      const lastSeen = b.profile?.last_seen_at;
      const isOnline = lastSeen && (Date.now() - new Date(lastSeen).getTime() < 180000);
      if (!isOnline) return false;
    }
    if (buddySearchInput.trim()) {
      const q = buddySearchInput.toLowerCase().trim();
      return b.profile?.name?.toLowerCase().includes(q) || b.profile?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#ECEFF6] min-h-screen text-slate-900 font-sans p-3 sm:p-5 md:p-6 rounded-[32px] space-y-6 select-none pb-24 lg:pb-8"
    >
      
      {/* ── TOP NAVIGATION & FILTER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Title & Interactive Dropdown Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-white/80 flex items-center gap-2 cursor-pointer hover:shadow transition-all group"
            >
              <span className="font-extrabold text-sm text-slate-900">Buddies Command Center</span>
              <span className={`material-symbols-outlined text-slate-400 text-base transition-transform ${isNavDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Nav Dropdown Overlay */}
            {isNavDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNavDropdownOpen(false)}></div>
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-40 animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Squad Controls
                  </div>
                  <ul className="space-y-1 pt-1 text-xs font-bold text-slate-700">
                    <li>
                      <button
                        onClick={() => { setActiveTab('all'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#8B5CF6]">groups</span>
                        <span>All Squad Friends</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveTab('online'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#10B981]">wifi_tethering</span>
                        <span>Online Friends Now</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveTab('pending'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#F59E0B]">notifications</span>
                        <span>Pending Invites</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { router.push('/rooms'); setIsNavDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-[#3B82F6]">meeting_room</span>
                        <span>Squad Arenas Hub</span>
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
              { id: 'all', label: `All Buddies (${buddies.length})` },
              { id: 'online', label: `Online Now (${onlineBuddies.length})` },
              { id: 'pending', label: `Pending (${pendingRequests.length})` },
              { id: 'global', label: 'Global Directory' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Connect Buddy</span>
          </button>

          <button
            onClick={() => router.push('/rooms')}
            className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs py-2.5 px-5 rounded-full transition-all hover:scale-105 cursor-pointer shadow-sm border border-white/80 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base text-[#8B5CF6]">groups</span>
            <span>Squad Arenas</span>
          </button>
        </div>
      </div>

      {/* ── TOP STATS WIDGETS ROW (4 COLUMNS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Widget 1: Active Squad Friends */}
        <div 
          onClick={() => setActiveTab('all')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#8B5CF6] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">groups</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Squad</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{buddies.length} Friends</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#8B5CF6] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Squad
          </span>
        </div>

        {/* Widget 2: Online Now */}
        <div 
          onClick={() => setActiveTab('online')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#10B981] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm relative">
              <span className="material-symbols-outlined text-xl font-bold">wifi_tethering</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Now</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{onlineBuddies.length} Active</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
          </span>
        </div>

        {/* Widget 3: Pending Requests */}
        <div 
          onClick={() => setActiveTab('pending')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#F59E0B] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] text-gray-900 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">notifications</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Invites</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{pendingRequests.length} Waiting</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {pendingRequests.length > 0 ? 'Review' : 'Clear'}
          </span>
        </div>

        {/* Widget 4: Global Network */}
        <div 
          onClick={() => setActiveTab('global')}
          className="morphism-card p-5 bg-white flex items-center justify-between group hover:border-[#3B82F6] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">public</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Directory</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{globalUsers.length}+ Contenders</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#3B82F6] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Explore
          </span>
        </div>

      </div>

      {/* ── MAIN CONTENT GRID (12 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SQUAD FRIENDS & GLOBAL SEARCH (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Squad Friends Card */}
          {(activeTab === 'all' || activeTab === 'online') && (
            <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-base font-bold">groups</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Active Squad Friends</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Your connected study buddies ready for 1v1 duels</p>
                  </div>
                </div>

                {/* Inline Live Filter Search Input */}
                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <span className="material-symbols-outlined text-slate-400 text-sm mr-1.5">search</span>
                  <input
                    type="text"
                    value={buddySearchInput}
                    onChange={(e) => setBuddySearchInput(e.target.value)}
                    placeholder="Filter buddies..."
                    className="bg-transparent text-slate-900 focus:outline-none w-32 sm:w-40 font-medium"
                  />
                </div>
              </div>

              {filteredBuddiesList.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50 space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-4xl block">group_add</span>
                  <p className="text-xs font-bold text-slate-600">No matching study buddies found.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#3B82F6] text-white text-xs font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-sm"
                  >
                    + Find Study Cohorts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredBuddiesList.map(b => {
                    const isUserOnline = b.profile?.last_seen_at && (Date.now() - new Date(b.profile.last_seen_at).getTime() < 180000);
                    return (
                      <div 
                        key={b.profile.id} 
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-[#8B5CF6] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full p-0.5 border-2 border-[#8B5CF6] shrink-0 relative">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                              <img 
                                src={b.profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} 
                                className="w-full h-full object-cover" 
                                alt={b.profile.name} 
                              />
                            </div>
                            {isUserOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-ping"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#8B5CF6] transition-colors">
                              {b.profile.name || 'Arena Fighter'}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                                isUserOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isUserOnline ? 'Online' : 'Offline'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold">Lvl {b.profile?.level || 1}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setChallengeTargetBuddy(b.profile);
                              setIsChallengeModalOpen(true);
                            }}
                            className="bg-[#1D1D1F] hover:bg-black text-white p-2 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-sm flex items-center gap-1 font-bold"
                            title="Challenge 1v1 Battle"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">swords</span>
                          </button>

                          <button
                            onClick={() => handleRejectRequest(b.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-colors cursor-pointer text-xs"
                            title="Disconnect buddy"
                          >
                            <span className="material-symbols-outlined text-sm">person_remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Global Directory & Recommended Cohorts Card */}
          {(activeTab === 'all' || activeTab === 'global') && (
            <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-base font-bold">explore</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Global Directory &amp; Recommended Cohorts</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Discover active study fighters worldwide</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">{globalUsers.length} available</span>
              </div>

              {loadingGlobal ? (
                <p className="text-xs text-slate-400 font-medium">Scanning worldwide directory...</p>
              ) : globalUsers.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">No public profiles found in registry.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {globalUsers.map(u => {
                    const isUserOnline = u.last_seen_at && (Date.now() - new Date(u.last_seen_at).getTime() < 180000);
                    const isBuddy = buddies.some(b => b.profile.id === u.id);
                    return (
                      <div key={u.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-[#3B82F6] transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full p-0.5 border border-[#3B82F6] shrink-0 relative">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                              <img src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" alt={u.name} />
                            </div>
                            {isUserOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-ping"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">{u.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                                isUserOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isUserOnline ? 'Online' : 'Offline'}
                              </span>
                              {isBuddy && (
                                <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0 border border-purple-200">Buddy</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isBuddy && (
                          <button
                            onClick={() => handleSendRequest(u.id)}
                            className="bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                          >
                            + Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PENDING REQUESTS & LOBBY INVITES (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pending Requests Widget */}
          {(activeTab === 'all' || activeTab === 'pending') && (
            <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F59E0B] font-bold">notifications</span>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Pending Invites
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{pendingRequests.length} waiting</span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 border border-slate-100 rounded-2xl text-center bg-slate-50">
                  <p className="text-xs text-slate-400 font-medium">No pending buddy requests</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingRequests.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={p.profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                        <span className="text-xs font-extrabold text-slate-900 truncate">{p.profile.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(p.id)}
                          className="bg-[#10B981] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg hover:bg-emerald-600 cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(p.id)}
                          className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-slate-300 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Arena Lobby Inviter Widget */}
          <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#10B981] font-bold">send</span>
              <h3 className="font-extrabold text-sm text-slate-900">
                Direct Arena Inviter
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Your Hosted Arena</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {myRooms.length === 0 ? (
                    <option value="">No active rooms hosted by you</option>
                  ) : (
                    myRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (#{r.type})</option>
                    ))
                  )}
                </select>
              </div>

              {buddies.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700">Invite Buddy to Lobby</label>
                  {buddies.slice(0, 4).map(b => (
                    <div key={b.profile.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{b.profile.name}</span>
                      <button
                        onClick={() => handleSendLobbyInvite(b.profile.id)}
                        className="bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg transition-transform hover:scale-105 cursor-pointer"
                      >
                        Send Invite 📩
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── MODAL 1: QUICK CONNECT BUDDY MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-4 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] font-bold">person_add</span>
                <h3 className="font-extrabold text-base text-slate-900">
                  Connect New Study Buddy
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSearchResults([]);
                  setQuickConnectInput('');
                }}
                className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={quickConnectInput}
                onChange={(e) => {
                  setQuickConnectInput(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                placeholder="Search contestant by name or email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#3B82F6]"
              />

              <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pt-1">
                {searching ? (
                  <p className="text-xs text-slate-400 font-medium">Scanning directory...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">Type a name or email to search study cohorts</p>
                ) : (
                  searchResults.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={s.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt="" />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 truncate block">{s.name}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{s.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(s.id)}
                        className="bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-transform hover:scale-105 cursor-pointer"
                      >
                        + Connect
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: 1v1 BATTLE CHALLENGE MODAL ── */}
      {isChallengeModalOpen && challengeTargetBuddy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B5CF6] font-bold">swords</span>
                <h3 className="font-extrabold text-base text-slate-900">
                  Challenge {challengeTargetBuddy.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsChallengeModalOpen(false);
                  setChallengeTargetBuddy(null);
                }}
                className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunch1v1Challenge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duel Title</label>
                <input
                  type="text"
                  required
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  placeholder="e.g. 1v1 Focus Duel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setChallengeDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        challengeDuration === mins
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Token Stake Wager (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={challengeStake}
                  onChange={(e) => setChallengeStake(Number(e.target.value))}
                  placeholder="0 Tokens"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChallengeModalOpen(false);
                    setChallengeTargetBuddy(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingChallenge}
                  className="flex-1 bg-[#8B5CF6] hover:bg-purple-600 text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {sendingChallenge ? 'Launching...' : 'Send Challenge ⚔️'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
