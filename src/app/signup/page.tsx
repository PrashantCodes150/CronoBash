"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import InteractiveAuthBackground from '@/components/InteractiveAuthBackground';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  // Password Security Rules Validation Engine
  const rules = [
    { label: '8+ Characters', actionHint: 'Add at least 8 characters', valid: password.length >= 8 },
    { label: 'Uppercase (A-Z)', actionHint: 'Include an uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase (a-z)', actionHint: 'Include a lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Number (0-9)', actionHint: 'Include a number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Symbol (!@#$%)', actionHint: 'Include a special symbol (!@#$%)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const score = rules.filter(r => r.valid).length;
  const isStrongPassword = score === 5;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (score === 3) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const strengthInfo = getStrengthLabel();

  const [verificationSent, setVerificationSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const getCanonicalOrigin = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return window.location.origin;
    }
    return 'https://cronobash.com';
  };

  const DISPOSABLE_EMAIL_DOMAINS = [
    'tempmail.com', 'temp-mail.org', '10minutemail.com', 'mailinator.com',
    'guerrillamail.com', 'throwawaymail.com', 'yopmail.com', 'sharklasers.com',
    'getnada.com', 'dispostable.com', 'trashmail.com', 'fakemailgenerator.com',
    'mohmal.com', 'crazymailing.com', 'generator.email', 'emailondeck.com',
    'burnermail.io', 'dropmail.me', 'mytemp.email', 'inboxkitten.com',
    'tempail.com', 'trashmail.net', 'mytempemail.com', 'mailcatch.com',
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid, authentic email address (e.g. name@gmail.com).');
      return;
    }

    const emailDomain = cleanEmail.split('@')[1];
    if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
      setErrorMsg('Temporary/disposable email addresses are not permitted. Please use a permanent email address (Gmail, Outlook, Yahoo, iCloud, or School/Work domain).');
      return;
    }

    if (!isStrongPassword) {
      setErrorMsg('Please fulfill all 5 password security rules below before creating an account.');
      return;
    }

    setLoading(true);
    try {
      const origin = getCanonicalOrigin();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/dashboard`,
          data: {
            name: fullName.trim(),
            full_name: fullName.trim(),
          }
        }
      });

      if (error) {
        console.error("Supabase signUp error:", error);
        const msg = error.message || error.toString() || 'Sign up failed. Please try again.';
        setErrorMsg(msg);
        setLoading(false);
      } else if (data?.user && !data?.session) {
        // Email confirmation is active on Supabase (SMTP required)
        setSubmittedEmail(cleanEmail);
        setVerificationSent(true);
        setLoading(false);
      } else {
        router.replace('/onboarding');
      }
    } catch (e: any) {
      console.error("Signup exception:", e);
      const msg = e?.message || String(e) || 'An unexpected error occurred during sign up.';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const origin = getCanonicalOrigin();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
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
      
      {/* Fixed Viewport-Locked Background Frame Image */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/squad-frames/frame_001.webp')`,
            filter: 'blur(8px)',
            opacity: 0.35,
            transform: 'scale(1.05)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFC]/60 via-transparent to-[#FAFAFC]/70" />
      </div>
      
      {/* Top Header - High Z-Index & Crystal Sharp */}
      <header className="relative z-20 w-full flex justify-between items-center px-6 md:px-12 py-6 max-w-[1280px] mx-auto">
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

      {/* Main Centered Sign-Up Card with Premium Glassmorphism */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-3 py-6">
        <div className="w-full max-w-[330px] bg-white/75 backdrop-blur-2xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)]">
          
          {verificationSent ? (
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Verify Your Email
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  We sent a confirmation link to <span className="font-bold text-slate-900">{submittedEmail}</span>. Please check your inbox and click the link to activate your account.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="block w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-4 text-xs font-semibold shadow-xs transition-all text-center"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-left">
                <h1
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Create Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Sign up to start your focus sprints.</p>
              </div>

          {errorMsg && (
            <div className="bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl p-3.5 text-xs text-red-600 mb-5 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Official Google OAuth Glass Button */}
          <div className="mb-5">
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/80 hover:bg-white border border-white/90 backdrop-blur-md rounded-2xl transition-all duration-150 text-xs font-bold text-slate-800 shadow-sm active:scale-[0.99]"
              type="button"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Sign Up with Google</span>
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
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block ml-0.5" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="w-full bg-white/60 border border-slate-200/80 backdrop-blur-md rounded-2xl py-3 px-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-150 outline-none shadow-inner"
                id="fullName"
                name="full_name"
                autoComplete="name"
                placeholder="Jane Doe"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block ml-0.5" htmlFor="email">
                Email
              </label>
              <input
                className="w-full bg-white/60 border border-slate-200/80 backdrop-blur-md rounded-2xl py-3 px-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-150 outline-none shadow-inner"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="jane@company.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input with Eye Option & Live Security Rules */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-0.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
                {password.length > 0 && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthInfo.text}`}>
                    Strength: {strengthInfo.label}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  className="w-full bg-white/60 border border-slate-200/80 backdrop-blur-md rounded-2xl py-3 pl-4 pr-11 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-150 outline-none shadow-inner"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {/* Eye Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Password Strength Progress Bar */}
              {password.length > 0 && (
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden flex gap-1 p-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        score >= level ? strengthInfo.color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Dynamic Password Weak Warning & Unfollowed Rules Hint */}
              {password.length > 0 && !isStrongPassword && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1.5 backdrop-blur-md animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Password too weak — Please do this:</span>
                  </div>
                  <div className="space-y-1 pl-1">
                    {rules.filter(r => !r.valid).map((r, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-900 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{r.actionHint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Password Secure Badge */}
              {password.length > 0 && isStrongPassword && (
                <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2 backdrop-blur-md animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Strong & Secure Password!</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                disabled={loading || !isStrongPassword}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 px-4 text-xs font-bold shadow-md transition-all duration-150 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                type="submit"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link className="font-semibold text-slate-900 hover:underline ml-0.5" href="/login">
                Sign In
              </Link>
            </p>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 px-6 text-center border-t border-slate-200/50 mt-auto">
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
