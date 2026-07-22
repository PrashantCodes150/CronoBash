"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        // Immediate 1-click route transition to dashboard
        router.replace('/dashboard');
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setErrorMsg('Cannot reach the server. Check your internet connection.');
      } else {
        setErrorMsg('An unexpected error occurred: ' + msg);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://focus-arena-gamma.vercel.app';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/dashboard`
        }
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || String(e));
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center bg-grid-pattern p-6">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="text-center mb-8">
            <div className="font-display text-3xl md:text-4xl font-medium tracking-wide flex items-center justify-center text-primary-fixed select-none">
              <span className="font-dancing text-4xl md:text-5xl font-bold italic pr-0.5 select-none">C</span>
              <span className="text-on-surface">ogni</span>
              <span className="font-dancing text-4xl md:text-5xl font-bold italic pl-1 pr-0.5 select-none">S</span>
              <span className="text-on-surface">weep</span>
            </div>
          <p className="font-label-mono text-xs text-on-surface-variant mt-2">
            Enter The Arena Console
          </p>
        </div>

        {errorMsg && (
          <div className="bg-error-container/20 border border-error/50 rounded-lg p-3 text-xs text-error mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm font-bold">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-label-mono text-xs text-on-surface-variant mb-1.5 uppercase">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fighter@cognisweep.com"
              className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 font-label-mono text-sm text-on-surface focus:outline-none focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-label-mono text-xs text-on-surface-variant uppercase">
                Password
              </label>
              <a href="#" className="font-label-mono text-[10px] text-primary-fixed hover:underline">
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 font-label-mono text-sm text-on-surface focus:outline-none focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary font-label-mono text-sm font-bold py-3 rounded-lg hover:bg-primary-fixed transition-colors mt-6 shadow-[0_0_15px_rgba(0,255,163,0.25)] hover:scale-[1.01] cursor-pointer"
          >
            {loading ? 'Entering Arena...' : 'Enter Arena'}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-outline-variant/30"></div>
          <span className="flex-shrink mx-4 font-label-mono text-[9px] text-on-surface-variant uppercase font-bold">Or</span>
          <div className="flex-grow border-t border-outline-variant/30"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary-fixed hover:border-primary-fixed font-label-mono text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign In with Google
        </button>

        <p className="text-center text-[10px] text-on-surface-variant mt-6 leading-relaxed select-none">
          By logging in, you agree to the Terms, Rules, and Privacy Policy.
        </p>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          New study contestant?{' '}
          <Link href="/signup" className="text-primary-fixed hover:underline">
            Register Rig
          </Link>
        </p>
      </div>
    </div>
  );
}
