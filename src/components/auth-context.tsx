"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, UserProfile, Wallet } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfileAndWallet = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!walletError && walletData) {
        setWallet(walletData as Wallet);
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
      .single();
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
    // Check active session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndWallet(session.user.id);
      }
      setLoading(false);
    };

    initSession();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndWallet(session.user.id);
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
