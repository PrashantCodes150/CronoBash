"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, UserProfile, Wallet } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  wallet: null,
  loading: true,
  refreshWallet: async () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfileAndWallet = async (userId: string, email?: string, metaName?: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let activeProfile = profileData;

      if (profileError || !activeProfile) {
        const { data: insertedProfile } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: metaName || 'Arena Fighter',
            email: email || '',
            avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'
          })
          .select()
          .single();
        if (insertedProfile) {
          activeProfile = insertedProfile;
        }
      }

      if (activeProfile) {
        const finalProfile = { ...activeProfile } as UserProfile;
        if ((!finalProfile.name || finalProfile.name === 'Arena Fighter') && metaName && metaName !== 'Arena Fighter') {
          finalProfile.name = metaName;
          await supabase.from('users').update({ name: metaName }).eq('id', userId);
        }
        setProfile(finalProfile);
      }

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let activeWallet = walletData;

      if (walletError || !activeWallet) {
        const { data: insertedWallet } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance: 1000
          })
          .select()
          .single();

        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'deposit',
          amount: 1000,
          description: 'Welcome bonus tokens credited.'
        });

        if (insertedWallet) {
          activeWallet = insertedWallet;
        }
      }

      if (activeWallet) {
        setWallet(activeWallet as Wallet);
      }
    } catch (e) {
      console.error('Error loading auth dependencies', e);
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
      .single();
    if (!error && data) {
      const finalProfile = { ...data } as UserProfile;
      const metaName = user.user_metadata?.name;
      if ((!finalProfile.name || finalProfile.name === 'Arena Fighter') && metaName && metaName !== 'Arena Fighter') {
        finalProfile.name = metaName;
        await supabase.from('users').update({ name: metaName }).eq('id', user.id);
      }
      setProfile(finalProfile);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWallet(null);
    router.push('/login');
  };

  useEffect(() => {
    // Check active session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name);
      }
      setLoading(false);
    };

    initSession();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Route guarding
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/', '/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/signup')) {
      router.push('/dashboard');
    }
  }, [user, pathname, loading, router]);

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

    updateLastSeen(); // Initial update
    const heartbeat = setInterval(updateLastSeen, 45000); // Every 45s

    return () => clearInterval(heartbeat);
  }, [user]);

  const isPublicRoute = ['/', '/login', '/signup'].includes(pathname);
  if (loading && !isPublicRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-background">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4 font-bold">INITIALIZING ARENA RIG...</p>
      </div>
    );
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
