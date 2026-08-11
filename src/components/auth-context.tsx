"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, UserProfile, Wallet } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

import LogoLoader from './LogoLoader';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileLocally: (newFields: Partial<UserProfile>) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  wallet: null,
  loading: true,
  refreshWallet: async () => { },
  refreshProfile: async () => { },
  updateProfileLocally: () => { },
  signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const updateProfileLocally = (newFields: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return newFields as UserProfile;
      return { ...prev, ...newFields };
    });
  };

  const getMergedProfile = (rawProfile: any, userObj: User | null): UserProfile => {
    let savedLocalOnboarding: any = null;
    if (typeof window !== 'undefined') {
      try {
        const userId = userObj?.id;
        const raw = userId ? localStorage.getItem(`cronobash_user_onboarding_data_${userId}`) : null;
        if (raw) savedLocalOnboarding = JSON.parse(raw);
      } catch (e) { }
    }

    const userMeta = userObj?.user_metadata || {};

    const name = rawProfile?.name || rawProfile?.full_name || userMeta?.name || userMeta?.full_name || savedLocalOnboarding?.name || 'Arena Fighter';
    const full_name = rawProfile?.full_name || rawProfile?.name || userMeta?.full_name || userMeta?.name || savedLocalOnboarding?.full_name || name;

    const rawAvatar = rawProfile?.avatar_url;
    const isDefaultBottts = !rawAvatar || rawAvatar === 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight';
    const avatar_url = (!isDefaultBottts ? rawAvatar : null) || userMeta?.avatar_url || savedLocalOnboarding?.avatar_url || rawAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight';

    const username = rawProfile?.username || rawProfile?.gamer_tag || userMeta?.username || userMeta?.gamer_tag || savedLocalOnboarding?.username || savedLocalOnboarding?.gamer_tag;

    const daily_goal_minutes = rawProfile?.daily_goal_minutes || userMeta?.daily_goal_minutes || savedLocalOnboarding?.daily_goal_minutes || 120;
    const primary_discipline = rawProfile?.primary_discipline || userMeta?.primary_discipline || savedLocalOnboarding?.primary_discipline || 'Engineering & Code';
    const preferred_stakes = rawProfile?.preferred_stakes || userMeta?.preferred_stakes || savedLocalOnboarding?.preferred_stakes || 'Micro-Stakes (₹10 - ₹50)';
    const ai_coach_persona = rawProfile?.ai_coach_persona || userMeta?.ai_coach_persona || savedLocalOnboarding?.ai_coach_persona || 'Drill Sergeant';
    const sound_effects = rawProfile?.sound_effects || userMeta?.sound_effects || savedLocalOnboarding?.sound_effects || 'Mechanical Key Clicks';
    const leaderboard_privacy = rawProfile?.leaderboard_privacy || userMeta?.leaderboard_privacy || savedLocalOnboarding?.leaderboard_privacy || 'Public Profile';
    const camera_verified = rawProfile?.camera_verified !== undefined ? rawProfile.camera_verified : (userMeta?.camera_verified !== undefined ? userMeta.camera_verified : (savedLocalOnboarding?.camera_verified !== undefined ? savedLocalOnboarding.camera_verified : true));

    let isSeenLocal = false;
    if (typeof window !== 'undefined') {
      const uId = rawProfile?.id || userObj?.id;
      if (uId) {
        try {
          isSeenLocal =
            localStorage.getItem(`cronobash_has_seen_onboarding_${uId}`) === 'true' ||
            localStorage.getItem(`onboarding_seen_${uId}`) === 'true';
        } catch (e) {}
      }
    }

    const has_seen_onboarding = Boolean(
      rawProfile?.has_seen_onboarding === true ||
      userMeta?.has_seen_onboarding === true ||
      savedLocalOnboarding?.has_seen_onboarding === true ||
      isSeenLocal === true
    );

    return {
      ...rawProfile,
      id: rawProfile?.id || userObj?.id || '',
      email: rawProfile?.email || userObj?.email || '',
      created_at: rawProfile?.created_at || new Date().toISOString(),
      name,
      full_name,
      username,
      gamer_tag: username,
      avatar_url,
      daily_goal_minutes,
      primary_discipline,
      preferred_stakes,
      ai_coach_persona,
      sound_effects,
      leaderboard_privacy,
      camera_verified,
      has_seen_onboarding,
    } as UserProfile;
  };

  const fetchProfileAndWallet = async (userId: string, email?: string, metaName?: string, userObjParam?: User | null) => {
    const activeUserObj = userObjParam || user;
    const fallbackProfile = getMergedProfile(null, activeUserObj);
    
    // Instantly set optimistic profile to unblock UI (<10ms)
    setProfile(prev => prev || fallbackProfile);

    try {
      // 3.5s Timeout Promise to prevent slow DB queries from hanging signin
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 3500)
      );

      const fetchPromise = Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle()
      ]);

      const [profileRes, walletRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;

      let activeProfile = profileRes?.data;
      let activeWallet = walletRes?.data;

      if (!activeProfile) {
        let savedLocalOnboarding: any = null;
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`cronobash_user_onboarding_data_${userId}`);
            if (raw) savedLocalOnboarding = JSON.parse(raw);
          } catch (e) { }
        }
        const initialAvatar = savedLocalOnboarding?.avatar_url || activeUserObj?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight';
        const initialName = metaName || savedLocalOnboarding?.name || activeUserObj?.user_metadata?.name || 'Arena Fighter';

        const { data: insertedProfile } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: initialName,
            full_name: initialName,
            email: email || '',
            avatar_url: initialAvatar,
            has_seen_onboarding: false
          })
          .select()
          .single();
        if (insertedProfile) activeProfile = insertedProfile;
      }

      if (!activeWallet) {
        const { data: insertedWallet } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();
        if (insertedWallet) activeWallet = insertedWallet;
      }

      const merged = getMergedProfile(activeProfile || fallbackProfile, activeUserObj);
      setProfile(merged);

      if (activeWallet) {
        setWallet(activeWallet as Wallet);
      }
    } catch (e) {
      console.warn('Auth profile/wallet fetch background warning (using optimistic profile):', e);
      setProfile(fallbackProfile);
    }
  };

  const refreshWallet = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!error && data) {
      setWallet(data as Wallet);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!error && data) {
      const merged = getMergedProfile(data, user);
      setProfile(merged);
    } else {
      const merged = getMergedProfile(profile, user);
      setProfile(merged);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    if (typeof window !== 'undefined') {
      try {
        const uId = user?.id;
        if (uId) {
          localStorage.removeItem(`cronobash_user_onboarding_data_${uId}`);
          localStorage.removeItem(`cronobash_has_seen_onboarding_${uId}`);
          localStorage.removeItem(`onboarding_seen_${uId}`);
        }
        localStorage.removeItem('cronobash_user_onboarding_data');
        localStorage.removeItem('cronobash_has_seen_onboarding');
        
        // Clear all keys matching cronobash_
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cronobash_') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {}
    }
    setUser(null);
    setProfile(null);
    setWallet(null);
    router.push('/login');
  };

  useEffect(() => {
    // Initial session check
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name, session.user);
        }
      } catch (e) {
        console.error("Session init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Fast Auth State listener - unblocks UI immediately on login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name, session.user);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fast Route guarding
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/', '/login', '/signup', '/terms', '/privacy', '/refund', '/legal'];
    const isPublicRoute = publicRoutes.includes(pathname);

    const hasOAuthParams = typeof window !== 'undefined' && (
      window.location.search.includes('code=') ||
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error=')
    );

    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user) {
      if (pathname === '/login' || pathname === '/signup' || hasOAuthParams) {
        if (hasOAuthParams && typeof window !== 'undefined') {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch (e) { }
        }
        if (profile && !profile.has_seen_onboarding) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, profile, pathname, loading, router]);

  // Online status heartbeat
  useEffect(() => {
    if (!user) return;

    const updateLastSeen = async () => {
      try {
        await supabase
          .from('users')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (e) {
        console.error("Heartbeat error:", e);
      }
    };

    updateLastSeen();
    const heartbeat = setInterval(updateLastSeen, 45000);

    return () => clearInterval(heartbeat);
  }, [user]);

  const isPublicRoute = ['/', '/login', '/signup', '/terms', '/privacy', '/refund', '/legal'].includes(pathname);
  if (loading && !isPublicRoute) {
    return <LogoLoader size="full" text="INITIALIZING ARENA RIG..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        loading,
        refreshWallet,
        refreshProfile,
        updateProfileLocally,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
