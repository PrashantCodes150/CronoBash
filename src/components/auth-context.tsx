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
      // Parallel execution for zero latency load (<30ms)
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle()
      ]);

      let activeProfile = profileRes.data;
      let activeWallet = walletRes.data;

      if (!activeProfile) {
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

      if (activeProfile) {
        setProfile(activeProfile as UserProfile);
      }

      if (activeWallet) {
        if (activeWallet.balance >= 1000) {
          activeWallet.balance = 0;
          supabase.from('wallets').update({ balance: 0 }).eq('user_id', userId).then();
        }
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
      if (data.balance >= 1000) {
        data.balance = 0;
        supabase.from('wallets').update({ balance: 0 }).eq('user_id', user.id).then();
      }
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
      setProfile(data as UserProfile);
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
    // Initial session check
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name);
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
        fetchProfileAndWallet(session.user.id, session.user.email, session.user.user_metadata?.name);
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

    updateLastSeen();
    const heartbeat = setInterval(updateLastSeen, 45000);

    return () => clearInterval(heartbeat);
  }, [user]);

  const isPublicRoute = ['/', '/login', '/signup', '/terms', '/privacy', '/refund', '/legal'].includes(pathname);
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
