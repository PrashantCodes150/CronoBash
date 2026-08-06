"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-context';
import LogoLoader from '@/components/LogoLoader';
import { supabase } from '@/lib/supabaseClient';
import { useProductivityStore } from '@/lib/productivity-store';
import { BADGES, Badge } from '@/lib/badges';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';
import { AvatarWithBadge } from '@/components/study/AvatarWithBadge';
import { VerifiedBadge } from '@/components/study/VerifiedBadge';
import { BadgesModal } from '@/components/study/BadgesModal';
import { Award, Clock, Flame, Trophy, User, Upload, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, refreshProfile, updateProfileLocally } = useAuth();
  const { sessions: localSessions } = useProductivityStore();
  
  const [dbSeconds, setDbSeconds] = useState(0);
  const [dbSessionsCount, setDbSessionsCount] = useState(0);
  const [dbStreakDays, setDbStreakDays] = useState(1);
  const [globalRank, setGlobalRank] = useState(1);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Badge for Qualification Inspector Card
  const [selectedBadge, setSelectedBadge] = useState<Badge>(BADGES[0]);

  // Black Pill Switches (Persisted in LocalStorage & Supabase)
  const [isProfilePublic, setIsProfilePublic] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profile_is_public');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [showRankBadge, setShowRankBadge] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profile_show_rank_badge');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [badgesModalOpen, setBadgesModalOpen] = useState(false);

  const handleToggleProfilePublic = async () => {
    const nextVal = !isProfilePublic;
    setIsProfilePublic(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile_is_public', String(nextVal));
    }
    toast.success(nextVal ? 'Profile is now Public.' : 'Profile is now Private.');
    if (!user) return;
    try {
      await supabase
        .from('users')
        .update({ is_public: nextVal })
        .eq('id', user.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleShowRankBadge = () => {
    const nextVal = !showRankBadge;
    setShowRankBadge(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile_show_rank_badge', String(nextVal));
    }
    toast.success(nextVal ? 'Global Rank badge visible.' : 'Rank badge hidden.');
  };

  // Edit profile modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editUsernameStatus, setEditUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [editUsernameError, setEditUsernameError] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editGoal, setEditGoal] = useState(120);
  const [savingProfile, setSavingProfile] = useState(false);

  // Live edit username check
  const checkEditUsernameAvailability = async (input: string) => {
    const formatted = input.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setEditUsername(formatted);
    if (!formatted || formatted.length < 3) {
      setEditUsernameStatus('idle');
      setEditUsernameError(formatted ? 'Username must be at least 3 characters' : '');
      return;
    }

    setEditUsernameStatus('checking');
    setEditUsernameError('');
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .or(`username.ilike.${formatted},gamer_tag.ilike.${formatted}`)
        .neq('id', user?.id || '')
        .limit(1);

      if (data && data.length > 0) {
        setEditUsernameStatus('taken');
        setEditUsernameError(`@${formatted} is taken by another user.`);
      } else {
        setEditUsernameStatus('available');
        setEditUsernameError('');
      }
    } catch (e) {
      console.error(e);
      setEditUsernameStatus('available');
    }
  };

  // Webcam & Gallery upload
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

  const stopProfileWebcam = () => {
    if (profileVideoRef.current && profileVideoRef.current.srcObject) {
      const stream = profileVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      profileVideoRef.current.srcObject = null;
    }
    setProfileWebcamActive(false);
  };

  useEffect(() => {
    return () => {
      stopProfileWebcam();
    };
  }, []);

  const handleOpenEditModal = () => {
    setEditName(profile?.name || '');
    setEditUsername(profile?.username || profile?.gamer_tag || '');
    setEditUsernameStatus('idle');
    setEditUsernameError('');
    setEditAvatar(profile?.avatar_url || '');
    setEditGoal(profile?.daily_goal_minutes || 120);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editUsernameStatus === 'taken') {
      toast.error('Please choose an available username.');
      return;
    }
    setSavingProfile(true);

    const cleanUser = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const updatedData = {
      name: editName.trim(),
      full_name: editName.trim(),
      username: cleanUser || undefined,
      gamer_tag: cleanUser || undefined,
      avatar_url: editAvatar.trim(),
      daily_goal_minutes: Number(editGoal)
    };

    // Instantly update React context
    updateProfileLocally(updatedData as any);

    try {
      // 1. Auth Metadata
      try {
        await supabase.auth.updateUser({
          data: updatedData
        });
      } catch (authErr) {
        console.warn('Auth metadata update warning:', authErr);
      }

      // 2. Database update
      try {
        await supabase
          .from('users')
          .update(updatedData)
          .eq('id', user.id);
      } catch (dbErr) {
        console.warn('Database update warning:', dbErr);
      }

      // 3. LocalStorage onboarding cache sync
      if (typeof window !== 'undefined' && user?.id) {
        try {
          const raw = localStorage.getItem(`cronobash_user_onboarding_data_${user.id}`);
          const prev = raw ? JSON.parse(raw) : {};
          const merged = { ...prev, ...updatedData };
          localStorage.setItem(`cronobash_user_onboarding_data_${user.id}`, JSON.stringify(merged));
        } catch (e) {}
      }

      await refreshProfile();
      setEditModalOpen(false);
      toast.success('Profile updated successfully! ✨');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadProfileData = async () => {
      try {
        const { data: sessions } = await supabase
          .from('study_sessions')
          .select('focus_seconds, start_time')
          .eq('user_id', user.id);

        if (sessions) {
          const totalSec = sessions.reduce((acc, s) => acc + (s.focus_seconds || 0), 0);
          setDbSeconds(totalSec);
          setDbSessionsCount(sessions.length);

          const toLocalDateStr = (iso: string) => {
            const d = new Date(iso);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };
          const todayLocalStr = toLocalDateStr(new Date().toISOString());

          const sessionDates = new Set<string>();
          for (const s of sessions) {
            sessionDates.add(toLocalDateStr(s.start_time));
          }

          let streak = 0;
          const checkDate = new Date();
          if (!sessionDates.has(todayLocalStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
          }

          while (sessionDates.has(toLocalDateStr(checkDate.toISOString()))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }

          setDbStreakDays(Math.max(1, streak));
        }

        const { data: leaders } = await supabase
          .from('users')
          .select('id, name, avatar_url, points, level, followers_count, is_verified, badges')
          .order('points', { ascending: false })
          .limit(10);

        if (leaders) {
          setLeaderboard(leaders);
        }

        // Calculate real, dynamic global rank from total user count with higher points
        const myPoints = profile?.points || profile?.xp || 0;
        const { count: higherRankCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gt('points', myPoints);

        if (higherRankCount !== null && higherRankCount !== undefined) {
          setGlobalRank(higherRankCount + 1);
        } else if (leaders) {
          const myRankIndex = leaders.findIndex(u => u.id === user.id);
          setGlobalRank(myRankIndex >= 0 ? myRankIndex + 1 : leaders.length + 1);
        }

        if (profile) {
          setIsProfilePublic(profile.is_public !== false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user, profile]);

  // Combine DB & Local store metrics dynamically
  const totalLocalSecs = useMemo(() => {
    return localSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  }, [localSessions]);

  const totalLifetimeSeconds = dbSeconds + totalLocalSecs;
  const totalLifetimeHours = (totalLifetimeSeconds / 3600).toFixed(1);
  const totalSessionsCount = dbSessionsCount + localSessions.length;

  // Real Dynamic User Level calculated from total focus hours + profile base
  const calculatedLevel = useMemo(() => {
    const hoursLevel = Math.floor(totalLifetimeSeconds / 1800);
    const baseLevel = profile?.level || 1;
    return Math.max(1, Math.max(baseLevel, hoursLevel));
  }, [totalLifetimeSeconds, profile]);

  // Automatically select active level badge
  useEffect(() => {
    const myBadge = BADGES[Math.max(0, Math.min(calculatedLevel - 1, BADGES.length - 1))];
    if (myBadge) setSelectedBadge(myBadge);
  }, [calculatedLevel]);

  const unlockedBadgesCount = BADGES.filter(b => b.reqLevel <= calculatedLevel).length;

  // Saved Onboarding Data Fallback (Ensures 100% real-time reflection of user's selected preferences)
  const savedOnboarding = useMemo(() => {
    if (typeof window === 'undefined' || !user?.id) return null;
    try {
      const raw = localStorage.getItem(`cronobash_user_onboarding_data_${user.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  const activeFullName = profile?.full_name || savedOnboarding?.full_name || profile?.name || 'Focus Athlete';
  const activeUsername = profile?.username || profile?.gamer_tag || savedOnboarding?.username || savedOnboarding?.gamer_tag;
  const activeGamerTag = activeUsername;
  const activeAvatarUrl = profile?.avatar_url || savedOnboarding?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight';
  const activeDailyGoal = profile?.daily_goal_minutes || savedOnboarding?.daily_goal_minutes || 120;
  const activeDiscipline = profile?.primary_discipline || savedOnboarding?.primary_discipline || 'Engineering & Code';
  const activeStakes = profile?.preferred_stakes || savedOnboarding?.preferred_stakes || 'Micro-Stakes (₹10 - ₹50)';
  const activeCoach = profile?.ai_coach_persona || savedOnboarding?.ai_coach_persona || 'Drill Sergeant';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LogoLoader size="md" text="LOADING USER PROFILE..." />
      </div>
    );
  }

  const isSelectedBadgeUnlocked = selectedBadge.reqLevel <= calculatedLevel;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* ── TOP METRIC CARDS ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Lifetime Hours</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{totalLifetimeHours} Hours</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Global Standing</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Rank #{globalRank}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Daily Streak</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{dbStreakDays} Days 🔥</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Unlocked Badges</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{unlockedBadgesCount} of 100 🎖️</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </motion.div>

      {/* ── CONTROLS & REAL FUNCTIONAL BLACK PILL SWITCHES ── */}
      <motion.div variants={itemVariants} className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">public</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Public Profile Visibility</span>
            <button
              onClick={handleToggleProfilePublic}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                isProfilePublic ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${isProfilePublic ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">workspace_premium</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Show Rank Badge</span>
            <button
              onClick={handleToggleShowRankBadge}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                showRankBadge ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${showRankBadge ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setBadgesModalOpen(true)}
            className="flex-1 md:flex-initial bg-[#F59E0B] text-white font-extrabold text-xs py-2.5 px-4 rounded-full transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:bg-amber-600"
          >
            <span>All 100 Emblem Badges 🎖️</span>
          </button>

          <button
            onClick={handleOpenEditModal}
            className="flex-1 md:flex-initial bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </motion.div>

      {/* ── PROFILE & LEADERBOARD GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User Card & Badge Qualification Inspector */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          
          <div className="morphism-card bg-white p-6 md:p-8 rounded-[28px] border border-white/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              
              {/* Avatar with Vector Emblem Overlay */}
              <AvatarWithBadge
                avatarUrl={activeAvatarUrl}
                name={activeFullName}
                level={calculatedLevel}
                isVerified={profile?.is_verified}
                size="xl"
              />

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">
                    {activeFullName}
                  </h3>
                  {activeGamerTag && (
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      @{activeGamerTag}
                    </span>
                  )}
                  <VerifiedBadge level={calculatedLevel} followersCount={profile?.followers_count || 0} isVerified={profile?.is_verified} size="md" showLevelNumber={true} />
                </div>
                <p className="text-xs text-slate-500 font-bold">{profile?.email || user?.email}</p>
                
                <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                  {showRankBadge && (
                    <span className="text-[10px] font-extrabold bg-blue-50 text-[#3B82F6] px-3 py-1 rounded-full border border-blue-100 uppercase animate-fadeIn">
                      Rank: #{globalRank} Global
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 uppercase">
                    Level {calculatedLevel} • {profile?.points || (calculatedLevel * 100)} XP
                  </span>
                  {activeDiscipline && (
                    <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 uppercase">
                      {activeDiscipline}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-6 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Sprints</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{totalSessionsCount}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Daily Goal</p>
                <p className="text-base font-black text-[#3B82F6] mt-0.5">{activeDailyGoal} m</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">AI Coach</p>
                <p className="text-base font-black text-[#FF5500] mt-0.5 truncate">{activeCoach}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Duel Stakes</p>
                <p className="text-base font-black text-emerald-600 mt-0.5 truncate">{activeStakes.split(' ')[0]}</p>
              </div>
            </div>
          </div>

          {/* BADGE QUALIFICATION INSPECTOR & DETAILS CARD */}
          <div className="morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F59E0B]" />
                <span>Emblem Badge Qualification &amp; Unlock Inspector</span>
              </h3>
              <button onClick={() => setBadgesModalOpen(true)} className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer">
                Explore All 100 Badges →
              </button>
            </div>

            {/* Selected Badge Inspector Header */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-center md:text-left">
                <BadgeDisplay badge={selectedBadge} isUnlocked={isSelectedBadgeUnlocked} size="lg" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                    <h4 className="text-base font-extrabold text-slate-900">{selectedBadge.name}</h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                      isSelectedBadgeUnlocked ? 'bg-emerald-50 text-[#10B981] border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {isSelectedBadgeUnlocked ? 'Unlocked ✓' : `Requires Level ${selectedBadge.reqLevel}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">{selectedBadge.description}</p>
                </div>
              </div>

              <div className="space-y-2 text-right shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                <div className="text-xs font-bold text-slate-400">Unlock Progress</div>
                <div className="text-lg font-black text-[#3B82F6]">
                  Level {calculatedLevel} / {selectedBadge.reqLevel}
                </div>
                <div className="w-full md:w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3B82F6] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((calculatedLevel / selectedBadge.reqLevel) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 100 Vector Badges Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BADGES.slice(0, Math.max(4, Math.min(calculatedLevel, 100))).slice(-4).map(b => {
                const isUnlocked = b.reqLevel <= calculatedLevel;
                const isSelected = selectedBadge.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBadge(b)}
                    className={`p-4 rounded-2xl border text-center space-y-2 flex flex-col items-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-[#3B82F6] ring-2 ring-blue-500/20 scale-105 shadow-sm'
                        : isUnlocked
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <BadgeDisplay badge={b} isUnlocked={isUnlocked} size="md" />
                    <p className="text-xs font-black text-slate-900 truncate w-full">{b.name}</p>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                      isUnlocked ? 'bg-amber-50 text-[#F59E0B]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      Level #{b.reqLevel} {isUnlocked ? '✓' : '🔒'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </motion.div>

        {/* Right Column (4 cols): Global Leaderboard */}
        <motion.div variants={itemVariants} className="lg:col-span-4 morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
              <span>Global Arena Leaderboard</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar p-0.5">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-8">Loading rankings...</p>
            ) : (
              leaderboard.map((item, index) => {
                const isMe = item.id === user?.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isMe
                        ? 'bg-blue-50 border-[#3B82F6] shadow-sm font-bold'
                        : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                      
                      <AvatarWithBadge
                        avatarUrl={item.avatar_url}
                        name={item.name}
                        level={item.level || (index + 1)}
                        isVerified={item.is_verified}
                        size="sm"
                      />

                      <span className="text-xs font-extrabold text-slate-900 truncate min-w-0">{item.name || 'User'}</span>
                    </div>

                    <span className="text-xs font-black text-[#3B82F6] shrink-0">{item.points || 0} XP</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Edit User Profile</h3>
              <button onClick={() => { stopProfileWebcam(); setEditModalOpen(false); }} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unique Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => checkEditUsernameAvailability(e.target.value)}
                    placeholder="focus_athlete"
                    className={`w-full bg-slate-50 border rounded-xl pl-8 pr-10 py-2 text-xs text-slate-900 focus:outline-none transition-all ${
                      editUsernameStatus === 'available'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                        : editUsernameStatus === 'taken'
                        ? 'border-red-500 ring-2 ring-red-500/10'
                        : 'border-slate-200 focus:border-[#3B82F6]'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {editUsernameStatus === 'checking' && (
                      <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {editUsernameStatus === 'available' && (
                      <span className="text-emerald-600 font-extrabold text-xs">✓</span>
                    )}
                    {editUsernameStatus === 'taken' && (
                      <span className="text-red-500 font-extrabold text-xs">✕</span>
                    )}
                  </div>
                </div>
                {editUsernameError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{editUsernameError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Daily Study Target (Minutes)</label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={editGoal}
                  onChange={e => setEditGoal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Photo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    placeholder="https://avatar-url.com"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleProfileFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { stopProfileWebcam(); setEditModalOpen(false); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingProfile} className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">
                  {savingProfile ? 'Saving...' : 'Save Profile ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {badgesModalOpen && (
        <BadgesModal isOpen={badgesModalOpen} onClose={() => setBadgesModalOpen(false)} userLevel={calculatedLevel} />
      )}

    </motion.div>
  );
}
