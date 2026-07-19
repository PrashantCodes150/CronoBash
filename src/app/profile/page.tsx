"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [lifetimeSeconds, setLifetimeSeconds] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [globalRank, setGlobalRank] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab control
  const [activeTab, setActiveTab] = useState<'profile' | 'buddies'>('profile');

  // Connection states
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [buddies, setBuddies] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Sync tab on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'buddies') {
        setActiveTab('buddies');
      }
    }
  }, []);

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
      const { error } = await supabase
        .from('connections')
        .insert({
          sender_id: user.id,
          receiver_id: targetId,
          status: 'pending'
        });
      if (error) throw error;
      alert("Buddy request sent!");
      loadConnections();
    } catch (e: any) {
      console.error(e);
      alert("Failed to send request: connection already exists or database constraint.");
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

  // Edit profile states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editGoal, setEditGoal] = useState(120);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile Webcam & Gallery upload states
  const [profileWebcamActive, setProfileWebcamActive] = useState(false);
  const profileVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startProfileWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (profileVideoRef.current) {
        profileVideoRef.current.srcObject = stream;
        setProfileWebcamActive(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const captureProfileSnapshot = () => {
    if (profileVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1);
        ctx.drawImage(profileVideoRef.current, -160, 0, 160, 160);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditAvatar(dataUrl);
        stopProfileWebcam();
      }
    }
  };

  const stopProfileWebcam = () => {
    if (profileVideoRef.current && profileVideoRef.current.srcObject) {
      const stream = profileVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      profileVideoRef.current.srcObject = null;
    }
    setProfileWebcamActive(false);
  };

  // Cleanup profile webcam
  useEffect(() => {
    return () => {
      if (profileVideoRef.current && profileVideoRef.current.srcObject) {
        const stream = profileVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditAvatar(profile.avatar_url || '');
      setEditGoal(profile.daily_goal_minutes || 120);
    }
  }, [profile]);

  // Fetch statistics from Supabase
  const loadProfileStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch all study sessions to calculate lifetime totals
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (!error && sessions) {
        let secSum = 0;
        sessions.forEach(s => {
          secSum += s.focus_seconds || 0;
        });
        setLifetimeSeconds(secSum);
        setTotalSessions(sessions.length);
      }

      // 2. Build leaderboard: fetch all users, then calculate focus hours via RPC or session aggregation
      //    Query study_sessions grouped by user_id to get total focus per user
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('user_id, focus_seconds, start_time');

      const focusByUser: Record<string, number> = {};
      if (allSessions) {
        for (const s of allSessions) {
          focusByUser[s.user_id] = (focusByUser[s.user_id] || 0) + (s.focus_seconds || 0);
        }
      }

      // Fetch user profiles for top focus users
      const userIds = Object.keys(focusByUser).slice(0, 10);
      if (userIds.length > 0) {
        const { data: usersList } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (usersList) {
          const enriched = usersList.map(u => ({
            ...u,
            hours: Math.round((focusByUser[u.id] || 0) / 3600 * 10) / 10
          })).sort((a, b) => b.hours - a.hours);
          setLeaderboard(enriched);

          // Calculate global rank: how many users have more focus than current user
          const myFocus = focusByUser[user.id] || 0;
          const rank = Object.values(focusByUser).filter(h => h > myFocus).length + 1;
          setGlobalRank(rank);
        }
      }

      // 3. Calculate streak from session history
      if (allSessions) {
        const sessionDates = new Set<string>();
        for (const s of allSessions) {
          sessionDates.add(new Date(s.start_time).toISOString().split('T')[0]);
        }

        let streak = 0;
        const checkDate = new Date();
        if (!sessionDates.has(checkDate.toISOString().split('T')[0])) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        while (sessionDates.has(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        setStreakDays(streak);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName.trim(),
          avatar_url: editAvatar.trim() || null,
          daily_goal_minutes: editGoal
        })
        .eq('id', user.id);

      if (!error) {
        await refreshProfile();
        setEditModalOpen(false);
      } else {
        alert('Update failed: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfileStats();
      loadConnections();
    }
  }, [user]);

  // Derive achievements from real data (computed after lifetimeHours)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">PULLING CONTESTANT PROFILE...</p>
      </div>
    );
  }

  const lifetimeHours = (lifetimeSeconds / 3600).toFixed(1);

  const achievements = [
    { id: '1', title: 'Focus Initiate', desc: 'Log your first study session in solo mode.', icon: 'military_tech', unlocked: totalSessions > 0 },
    { id: '2', title: 'Stakes Champion', desc: 'Participate and win in any money room contest.', icon: 'award_star', unlocked: lifetimeSeconds >= 3600 },
    { id: '3', title: 'Flow State Master', desc: 'Maintain an average of 95% focus score.', icon: 'bolt', unlocked: lifetimeSeconds >= 18000 },
    { id: '4', title: 'Consecutive Grind', desc: 'Reach a study streak of 10 days.', icon: 'local_fire_department', unlocked: streakDays >= 10 }
  ];

  const PRESET_AVATARS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight',
    'https://api.dicebear.com/7.x/bottts/svg?seed=neon-ninja',
    'https://api.dicebear.com/7.x/bottts/svg?seed=code-warrior',
    'https://api.dicebear.com/7.x/bottts/svg?seed=focus-master',
    'https://api.dicebear.com/7.x/bottts/svg?seed=arena-pro'
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Contestant Rig Profile</h2>
        <p className="text-xs text-on-surface-variant mt-1">Trace lifetime focus hours, active ranks, and unlocked achievements</p>
      </header>

      {/* Tab Selectors */}
      <div className="flex gap-3 border-b border-outline-variant/20 pb-3 font-mono text-xs">
        <button
          onClick={() => {
            setActiveTab('profile');
            window.history.pushState(null, '', '/profile');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold uppercase tracking-wider ${
            activeTab === 'profile'
              ? 'bg-primary-container text-on-primary border border-primary-container shadow-[0_0_15px_rgba(0,255,163,0.15)] font-black'
              : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
          }`}
        >
          RIG TELEMETRY & ACHS
        </button>
        <button
          onClick={() => {
            setActiveTab('buddies');
            window.history.pushState(null, '', '/profile?tab=buddies');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            activeTab === 'buddies'
              ? 'bg-primary-container text-on-primary border border-primary-container shadow-[0_0_15px_rgba(0,255,163,0.15)] font-black'
              : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xs">groups</span>
          STUDY BUDDIES ({buddies.length})
        </button>
      </div>

      {activeTab === 'profile' ? (
        /* Original Grid splits */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): User card, Achievements & Standings */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* User profile stats card */}
            <div className="card-base p-6 md:p-8 relative overflow-hidden group border-l-2 border-primary-fixed bg-grid-pattern">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              {/* Edit Profile trigger button */}
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container hover:text-primary-fixed border border-outline-variant hover:border-primary-fixed text-on-surface font-label-mono text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-container bg-surface-variant shrink-0">
                  <img 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                    src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} 
                  />
                </div>
                <div className="space-y-1 select-none text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h3 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">
                      {profile?.name || 'Arena Fighter'}
                    </h3>
                  </div>
                  <p className="font-label-mono text-xs text-on-surface-variant">{profile?.email}</p>
                  <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                    <span className="font-label-mono text-[9px] font-bold bg-primary-container/15 text-primary-fixed px-2 py-0.5 rounded border border-primary-container/30">
                      Rank: #{globalRank} Global
                    </span>
                    <span className="font-label-mono text-[9px] font-bold bg-secondary-container/15 text-secondary-fixed px-2 py-0.5 rounded border border-secondary-container/30">
                      Tier: {lifetimeSeconds >= 36000 ? 'Elite Cadet' : lifetimeSeconds >= 18000 ? 'Sprint Veteran' : lifetimeSeconds >= 3600 ? 'Focus Initiate' : 'Rookie'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/30 mt-6 pt-6 text-center">
                <div>
                  <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Lifetime Hours</p>
                  <p className="font-display text-2xl font-black text-on-surface mt-1">{lifetimeHours}h</p>
                </div>
                <div>
                  <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Total Sprints</p>
                  <p className="font-display text-2xl font-black text-on-surface mt-1">{totalSessions}</p>
                </div>
                <div>
                  <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold">Streaks</p>
                  <p className="font-display text-2xl font-black text-primary-fixed mt-1">{streakDays} Days</p>
                </div>
              </div>
            </div>

            {/* Achievements list */}
            <section className="glass-panel rounded-xl p-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Achievements & Badges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map(ach => (
                  <div 
                    key={ach.id} 
                    className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                      ach.unlocked 
                        ? 'bg-surface-container-low border-outline-variant/60 hover:border-primary-fixed-dim' 
                        : 'bg-surface-container-low/20 border-outline-variant/20 opacity-40'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                      ach.unlocked ? 'bg-primary-container/10 text-primary-fixed' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{ach.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-bold text-on-surface uppercase tracking-tight">{ach.title}</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (4 cols): Standings / Leaderboard */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Global standings */}
            <div className="glass-panel rounded-xl p-6 space-y-6 border-t-2 border-t-secondary-fixed">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Global Standings</h3>
              
              <div className="space-y-3 font-mono text-xs">
                {leaderboard.map((u, index) => {
                  const isCurrentUser = u.id === user?.id;
                  return (
                    <div 
                      key={u.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCurrentUser 
                          ? 'bg-primary-container/10 border-primary-fixed text-primary-fixed font-bold' 
                          : 'bg-surface-container-high/40 border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-xs font-extrabold">{index + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-variant shrink-0">
                          <img alt={u.name} className="w-full h-full object-cover" src={u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[100px]">{u.name}</span>
                          {u.is_pro && (
                            <span className="text-[7px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_5px_rgba(234,179,8,0.2)] shrink-0">
                              PRO
                            </span>
                          )}
                        </div>
                      </div>
                      <span>{u.hours} hrs</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Premium Study Buddies sub-interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Left Column (8 cols): Buddy List and Search users */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search users & follow */}
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary-fixed">person_search</span>
                Locate Focus Cohorts
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono">SEARCH CONTESTANTS BY DISPLAY NAME OR EMAIL ADDRESS TO FOLLOW THEM</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  className="flex-grow bg-background border border-outline-variant rounded-lg px-3 py-2 font-mono text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                />
                <button
                  onClick={handleSearchUsers}
                  className="bg-primary-container text-on-primary font-label-mono text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-fixed transition-colors cursor-pointer uppercase shrink-0"
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
                Study Buddies ({buddies.length})
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
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Configure Rig Profile</h3>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="text-on-surface-variant hover:text-primary-fixed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1.5">Avatar Source</label>
                <div className="flex gap-2 mb-2">
                  <label className="bg-surface-container-high hover:bg-surface border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">photo_library</span>
                    Gallery Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfileFileChange} 
                      className="hidden" 
                    />
                  </label>

                  <button
                    type="button"
                    onClick={profileWebcamActive ? stopProfileWebcam : startProfileWebcam}
                    className="bg-surface-container-high hover:bg-surface border border-outline-variant hover:border-primary-fixed hover:text-primary-fixed text-on-surface font-label-mono text-[9px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">videocam</span>
                    {profileWebcamActive ? 'Stop Camera' : 'Camera Snap'}
                  </button>
                </div>

                {profileWebcamActive && (
                  <div className="relative mt-2 w-full h-36 bg-black rounded-lg overflow-hidden border border-outline-variant flex flex-col justify-end p-2">
                    <video 
                      ref={profileVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="relative z-10 flex justify-end">
                      <button
                        type="button"
                        onClick={captureProfileSnapshot}
                        className="bg-primary-container text-on-primary text-[8px] font-bold px-2.5 py-1 rounded hover:bg-primary-fixed cursor-pointer"
                      >
                        Snap Pic
                      </button>
                    </div>
                  </div>
                )}

                <label className="block text-on-surface-variant text-[8px] uppercase font-bold mb-1 mt-3">Custom Image URL / Base64 Data</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://image-link.com/avatar.png"
                  className="w-full bg-background border border-outline-variant rounded-lg p-2 text-[10px] text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              {/* Preset avatar select shortcuts */}
              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-2">Preset Cyber Avatars</label>
                <div className="flex gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(url)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 hover:scale-105 transition-transform cursor-pointer ${
                        editAvatar === url ? 'border-primary-fixed bg-primary-container/15' : 'border-outline-variant bg-surface-container-high'
                      }`}
                    >
                      <img src={url} alt="Preset option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant text-[9px] uppercase font-bold mb-1">Daily Study Target (Minutes)</label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={editGoal}
                  onChange={(e) => setEditGoal(parseInt(e.target.value))}
                  className="w-full bg-background border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface py-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-primary-container text-on-primary font-bold py-2 rounded-lg hover:bg-primary-fixed transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,255,163,0.15)]"
                >
                  {savingProfile ? 'Saving Spec...' : 'Update Rig'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
