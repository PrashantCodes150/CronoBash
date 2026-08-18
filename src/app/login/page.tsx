"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import InteractiveAuthBackground from '@/components/InteractiveAuthBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !email.trim()) {
      setErrorMsg('Please enter your email address in the Email field above first.');
      return;
    }

    setResetLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cronobash.vercel.app';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/login`,
      });

      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('rate limit')) {
          msg = 'Too many requests. Please wait a few minutes before requesting another password reset email.';
        }
        setErrorMsg(msg);
      } else {
        setInfoMsg(`Password reset link sent to ${email.trim()}. Please check your email inbox!`);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message && error.message !== '{}' ? error.message : 'Invalid email or password. Please check your credentials.';
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes('email not confirmed')) {
          msg = 'Your email address is not verified yet. Please check your inbox for the confirmation email!';
        } else if (lowerMsg.includes('invalid login credentials')) {
          msg = 'Incorrect email or password. Please check your credentials and try again.';
        }
        
        setErrorMsg(msg);
        setLoading(false);
      } else if (data?.session) {
        // Instant navigation on valid auth session
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      const msg = e?.message && e.message !== '{}' ? e.message : 'An unexpected error occurred during sign in.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setErrorMsg('Cannot reach the server. Check your internet connection.');
      } else {
        setErrorMsg(msg);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cronobash.com';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`
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
    <div className="bg-[#FAFAFC] text-slate-900 min-h-screen flex flex-col justify-between font-sans selection:bg-slate-900 selection:text-white relative overflow-hidden">
      
      {/* Interactive Subtle Background Video Animation reacting to mouse position */}
      <InteractiveAuthBackground totalFrames={220} />
      
      {/* Top Header */}
      <header className="w-full flex justify-between items-center px-6 md:px-12 py-6 max-w-[1280px] mx-auto">
        <Link href="/" className="select-none">
          <span
            className="text-[28px] text-black leading-none select-none"
            style={{ fontFamily: '"Special Elite", serif', fontWeight: 400 }}
          >
            CronoBash
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Centered Sign-In Card with Premium Glassmorphism */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-3 py-6">
        <div className="w-full max-w-[330px] bg-white/75 backdrop-blur-2xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)]">
          
          <div className="mb-6 text-left">
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Enter your account credentials to continue.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl p-3.5 text-xs text-red-600 mb-5 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-50/90 backdrop-blur-md border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-700 mb-5 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Official Google OAuth Glass Button */}
          <div className="mb-5">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/80 hover:bg-white border border-white/90 backdrop-blur-md rounded-2xl transition-all duration-150 text-xs font-bold text-slate-800 shadow-sm active:scale-[0.99]"
              type="button"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-grow h-px bg-slate-200/80" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              OR EMAIL
            </span>
            <div className="flex-grow h-px bg-slate-200/80" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block ml-0.5" htmlFor="email">
                Email
              </label>
              <input
                className="w-full bg-white/60 border border-slate-200/80 backdrop-blur-md rounded-2xl py-3 px-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-150 outline-none shadow-inner"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-0.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={(e) => handleForgotPassword(e)}
                  disabled={resetLoading}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Forgot?'}
                </button>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-white/60 border border-slate-200/80 backdrop-blur-md rounded-2xl py-3 pl-4 pr-11 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-150 outline-none shadow-inner"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-4 text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                type="submit"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link className="font-semibold text-slate-900 hover:underline ml-0.5" href="/signup">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-slate-200/50 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400 font-medium">
          <span>© CronoBash Inc. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-slate-600 transition-colors">Refunds</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
