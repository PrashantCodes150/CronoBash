"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';

export default function BuddiesPage() {
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);

  // Connection states
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
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
  const [inviteTargetId, setInviteTargetId] = useState<string | null>(null);

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
          .select('id, name, avatar_url, email')
          .in('id', otherUserIds);
        if (!profError && profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const tempFollowers: any[] = [];
      const tempFollowing: any[] = [];
      const tempBuddies: any[] = [];
      const tempPending: any[] = [];

      conns.forEach(c => {
        const isSender = c.sender_id === user.id;
        const otherId = isSender ? c.receiver_id : c.sender_id;
        const otherProfile = profilesMap[otherId] || { id: otherId, name: 'Arena Fighter', avatar_url: '', email: '' };

        const connWithProfile = { ...c, profile: otherProfile };

        if (c.status === 'accepted') {
          tempBuddies.push(connWithProfile);
          tempFollowers.push(connWithProfile);
          tempFollowing.push(connWithProfile);
        } else if (c.status === 'pending') {
          if (isSender) {
            tempFollowing.push(connWithProfile);
          } else {
            tempFollowers.push(connWithProfile);
            tempPending.push(connWithProfile);
          }
        }
      });

      setFollowers(tempFollowers);
      setFollowing(tempFollowing);
      setBuddies(tempBuddies);
      setPendingRequests(tempPending);
    } catch (e) {
      console.error("Error loading connections:", e);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, email')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(8);
      if (!error && data) {
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    if (!user) return;
    try {
      const { data: existing, error: checkError } = await supabase
        .from('connections')
        .select('id, sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (checkError) throw checkError;

      const alreadyConnected = existing?.some(c => 
        (c.sender_id === user.id && c.receiver_id === targetId) ||
        (c.sender_id === targetId && c.receiver_id === user.id)
      );

      if (alreadyConnected) {
        alert("A connection or pending request already exists with this user!");
        return;
      }

      const { data: connData, error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: targetId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: targetId,
          title: 'Buddy Request',
          message: `${profile?.name || 'A user'} wants to be your study buddy!`,
          type: 'buddy_request',
          metadata: { connection_id: connData.id, sender_id: user.id }
        });

      alert("Buddy request sent!");
      loadConnections();
    } catch (e: any) {
      console.error(e);
      alert("Failed to send request: connection already exists.");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (error) throw error;
      alert("Buddy request accepted!");
      loadConnections();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to accept request.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', requestId);
      if (error) throw error;
      alert("Connection removed.");
      loadConnections();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to remove connection.");
    }
  };

  const loadGlobalDirectory = async () => {
    if (!user) return;
    setLoadingGlobal(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, email, last_seen_at, is_public')
        .eq('is_public', true)
        .neq('id', user.id)
        .limit(50);
      
      if (!error && data) {
        setGlobalUsers(data);
      }
    } catch (e) {
      console.error("Error loading global directory:", e);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const loadMyRooms = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user.id);
      if (!error && data) {
        setMyRooms(data);
        if (data.length > 0) {
          setSelectedRoom(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading my rooms:", e);
    }
  };

  const handleSendLobbyInvite = async (targetUserId: string) => {
    if (!selectedRoom || !user) {
      alert("Please select or create a study lobby first!");
      return;
    }
    const room = myRooms.find(r => r.id === selectedRoom);
    if (!room) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title: 'Lobby Invite',
          message: `${profile?.name || 'A user'} has invited you to join their study lobby: "${room.name}"`,
          type: 'invite',
          metadata: { room_id: room.id, invite_code: room.invite_code, sender_id: user.id }
        });

      if (error) throw error;
      alert("Lobby invite sent successfully!");
      setInviteTargetId(null);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send lobby invite.");
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">SYNCHRONIZING BUDDY LINK...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-surface-container relative overflow-hidden shadow-[0_0_30px_rgba(0,255,163,0.15)] text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(0,255,163,0.3)] animate-pulse">
              <span className="material-symbols-outlined text-2xl font-bold animate-bounce">groups</span>
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">Study Buddies</h1>
              <p className="font-mono text-xs text-emerald-300 font-semibold">Global Squad Network &amp; Real-time Contenders</p>
            </div>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant max-w-xl leading-relaxed uppercase pt-1">
            CONNECT WITH PLAYERS GLOBALLY, INVITE ONLINE CONTENDERS TO YOUR FOCUS ROOMS, AND TRACK ACTIVE LEAGUE FRIENDS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Left Column (8 cols): Buddy List and Search users */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Search users & follow */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-surface-container border border-emerald-500/30 shadow-[0_0_20px_rgba(0,255,163,0.1)]">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-400 animate-pulse">person_search</span>
              <span>Locate Focus Cohorts</span>
            </h3>
            <p className="text-[10px] text-emerald-300/80 font-mono">SEARCH CONTESTANTS BY DISPLAY NAME OR EMAIL ADDRESS TO FOLLOW THEM</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="flex-grow bg-background border border-emerald-500/30 rounded-xl px-3.5 py-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleSearchUsers}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold px-5 py-2 rounded-xl transition-all hover:scale-105 cursor-pointer uppercase shrink-0 shadow-[0_0_12px_rgba(0,255,163,0.3)]"
              >
                Search
              </button>
            </div>

            {searching && (
              <p className="font-mono text-[9px] text-on-surface-variant uppercase animate-pulse">Scanning server registry...</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-outline-variant/20">
                <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider block">Search Results</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map(s => {
                    const isBuddy = buddies.some(b => b.profile.id === s.id);
                    const isFollowing = following.some(f => f.profile.id === s.id);
                    return (
                      <div key={s.id} className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                            <img src={s.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" alt={s.name} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-display text-xs font-bold text-on-surface uppercase truncate block">{s.name}</span>
                            <span className="font-mono text-[8px] text-on-surface-variant truncate block">{s.email}</span>
                          </div>
                        </div>

                        {isBuddy ? (
                          <span className="font-mono text-[8px] bg-primary-container/20 text-primary-fixed px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0 border border-primary-container/30">Buddy</span>
                        ) : isFollowing ? (
                          <span className="font-mono text-[8px] bg-surface-container-high text-on-surface-variant px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0 border border-outline-variant">Pending</span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(s.id)}
                            className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[9px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase shrink-0"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Buddies list (Mutual followers) */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary-fixed">groups</span>
              Active Buddies ({buddies.length})
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">MUTUAL CONNECTIONS READY FOR DUAL FOCUS SPARK ARENA BATTLES</p>
            
            {buddies.length === 0 ? (
              <div className="p-8 border border-dashed border-outline-variant/30 rounded-xl text-center">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl block mb-2">group_add</span>
                <span className="font-display text-xs font-bold text-on-surface-variant uppercase">No study buddies connected yet.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {buddies.map(b => (
                  <div key={b.profile.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-container bg-surface-variant shrink-0">
                        <img src={b.profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" alt={b.profile.name} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-display text-xs font-bold text-on-surface uppercase truncate block">{b.profile.name}</span>
                        <span className="font-mono text-[8px] text-[#00ffa3] tracking-widest font-black uppercase block">STUDY BUDDY</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRejectRequest(b.id)}
                      className="bg-error-container/20 hover:bg-error/30 text-error font-label-mono text-[9px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase shrink-0 border border-error/20"
                      title="Disconnect buddy"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Directory & Online Buddies */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary-fixed">explore</span>
              Global Directory & Online Buddies
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">DISCOVER PUBLIC ARENA PROFILES WORLDWIDE & INVITE ONLINE PLAYERS TO YOUR LOBBIES</p>

            {loadingGlobal ? (
              <p className="font-mono text-[9px] text-on-surface-variant uppercase animate-pulse">Scanning worldwide directory...</p>
            ) : globalUsers.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant font-mono uppercase pl-1">No public profiles found in the registry.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {globalUsers.map(u => {
                  const isUserOnline = u.last_seen_at && (Date.now() - new Date(u.last_seen_at).getTime() < 180000);
                  const isBuddy = buddies.some(b => b.profile.id === u.id);
                  return (
                    <div key={u.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0 relative">
                            <img src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" alt={u.name} />
                            {isUserOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00ffa3] border-2 border-surface-container-low animate-pulse"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-display text-xs font-bold text-on-surface uppercase truncate block">{u.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`font-mono text-[7px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                                isUserOnline ? 'bg-[#00ffa3]/10 text-[#00ffa3]' : 'bg-surface-variant text-on-surface-variant/75'
                              }`}>
                                {isUserOnline ? 'Online' : 'Offline'}
                              </span>
                              {isBuddy && (
                                <span className="font-mono text-[7px] bg-primary-container/20 text-primary-fixed px-1 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 border border-primary-container/30">Buddy</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invite / Connect Action */}
                      <div className="pt-1.5 border-t border-outline-variant/10 flex flex-col gap-2">
                        {inviteTargetId === u.id ? (
                          <div className="space-y-2 font-mono">
                            <label className="block text-[8px] text-on-surface-variant uppercase font-bold">Select Study Arena:</label>
                            {myRooms.length === 0 ? (
                              <div className="text-[8px] text-error uppercase font-bold leading-normal">
                                No arenas owned. Create an arena first to invite!
                                <button onClick={() => setInviteTargetId(null)} className="text-on-surface-variant underline ml-1 cursor-pointer">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <select
                                  value={selectedRoom}
                                  onChange={(e) => setSelectedRoom(e.target.value)}
                                  className="w-full bg-background border border-outline-variant rounded p-1 text-[9px] text-on-surface focus:outline-none"
                                >
                                  {myRooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleSendLobbyInvite(u.id)}
                                    className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary font-bold text-[8px] uppercase py-1 cursor-pointer border border-primary-container"
                                  >
                                    Send Invite
                                  </button>
                                  <button
                                    onClick={() => setInviteTargetId(null)}
                                    className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface font-bold text-[8px] uppercase py-1 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            {isUserOnline && (
                              <button
                                onClick={() => {
                                  setInviteTargetId(u.id);
                                  loadMyRooms();
                                }}
                                className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[8px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer uppercase border border-primary-container flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[10px]">campaign</span>
                                Invite to Lobby
                              </button>
                            )}
                            {!isBuddy && (
                              <button
                                onClick={() => handleSendRequest(u.id)}
                                className="flex-1 bg-surface-container-high hover:bg-surface border border-outline-variant text-on-surface font-label-mono text-[8px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer uppercase flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[10px]">person_add</span>
                                Connect
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Follow lists & Invites */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Incoming Requests */}
          {pendingRequests.length > 0 && (
            <div className="glass-panel rounded-xl p-5 border-t-2 border-t-primary-fixed space-y-4">
              <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary-fixed">person_add_alt</span>
                Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map(r => (
                  <div key={r.id} className="p-3 bg-background/50 rounded-lg border border-outline-variant/30 flex flex-col gap-2 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-outline-variant shrink-0">
                        <img src={r.profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" alt={r.profile.name} />
                      </div>
                      <span className="text-[11px] font-bold text-on-surface truncate uppercase">{r.profile.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(r.id)}
                        className="flex-1 bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[8px] font-bold py-1 rounded cursor-pointer uppercase border border-primary-container"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(r.id)}
                        className="flex-1 bg-surface-container-high hover:bg-surface border border-outline-variant text-on-surface font-label-mono text-[8px] font-bold py-1 rounded cursor-pointer uppercase"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Followers / Following counts summary */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Social Ledger</h3>
            
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="bg-background/40 p-3 rounded-lg border border-outline-variant/20">
                <span className="text-on-surface-variant block uppercase text-[8px] font-bold tracking-wider mb-1">Followers</span>
                <span className="font-display text-lg font-black text-white">{followers.length}</span>
              </div>
              <div className="bg-background/40 p-3 rounded-lg border border-outline-variant/20">
                <span className="text-on-surface-variant block uppercase text-[8px] font-bold tracking-wider mb-1">Following</span>
                <span className="font-display text-lg font-black text-white">{following.length}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider mb-1.5 block">Currently Following</span>
                {following.length === 0 ? (
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase italic block pl-1">0 Users</span>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {following.map(f => (
                      <div key={f.id} className="flex items-center justify-between text-xs font-mono p-1.5 bg-background/25 rounded border border-outline-variant/15">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img src={f.profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                          <span className="truncate text-[10px] text-on-surface uppercase">{f.profile.name}</span>
                        </div>
                        {f.status === 'pending' && <span className="text-[7px] text-on-surface-variant bg-surface-container px-1 py-0.5 rounded font-bold uppercase tracking-wider">Pending</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
