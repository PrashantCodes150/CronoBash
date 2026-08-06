"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-context';
import InteractiveAuthBackground from '@/components/InteractiveAuthBackground';
import { toast } from 'react-hot-toast';

// Helper to compress uploaded / snapshot avatar images to tiny <15KB JPEGs to prevent quota & payload errors
const compressImage = (dataUrl: string, maxWidth = 120, maxHeight = 120, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export default function OnboardingPage() {
  const { user, profile, refreshProfile, updateProfileLocally } = useAuth();
  const router = useRouter();

  // Step state (1 to 6)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Step 1: Profile Identity & Avatar ──
  const [displayName, setDisplayName] = useState((profile as any)?.full_name || profile?.name || '');
  const [username, setUsername] = useState((profile as any)?.username || (profile as any)?.gamer_tag || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight');
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Live username availability check against Supabase DB
  const checkUsernameAvailability = async (input: string) => {
    const formatted = input.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(formatted);
    if (!formatted || formatted.length < 3) {
      setUsernameStatus('idle');
      setUsernameError(formatted ? 'Username must be at least 3 characters' : '');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError('');
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .or(`username.ilike.${formatted},gamer_tag.ilike.${formatted}`)
        .neq('id', user?.id || '00000000-0000-0000-0000-000000000000')
        .limit(1);

      if (data && data.length > 0) {
        setUsernameStatus('taken');
        setUsernameError(`@${formatted} is already taken by another user.`);
      } else {
        setUsernameStatus('available');
        setUsernameError('');
      }
    } catch (e) {
      console.error(e);
      setUsernameStatus('available');
    }
  };

  const presetAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight',
    'https://api.dicebear.com/7.x/bottts/svg?seed-[#FF5500]',
    'https://api.dicebear.com/7.x/bottts/svg?seed=overlord',
    'https://api.dicebear.com/7.x/bottts/svg?seed=samurai',
  ];

  // ── Step 2: Daily Focus Goals ──
  const [dailyGoal, setDailyGoal] = useState(120); // mins
  const [primaryGoal, setPrimaryGoal] = useState('Engineering & Code');

  // ── Step 3: Arena & Matchmaking Preferences ──
  const [preferredStakes, setPreferredStakes] = useState('Micro-Stakes (₹10 - ₹50)');
  const [cameraVerified, setCameraVerified] = useState(true);

  // ── Step 4: AI Coach Persona ──
  const [coachPersona, setCoachPersona] = useState('Drill Sergeant');

  // ── Step 5: Notifications & Privacy ──
  const [soundEffects, setSoundEffects] = useState('Mechanical Key Clicks');
  const [leaderboardPrivacy, setLeaderboardPrivacy] = useState('Public Profile');

  // Sync profile name
  useEffect(() => {
    const pName = (profile as any)?.full_name || profile?.name;
    if (pName && !displayName) {
      setDisplayName(pName);
    }
    const pUsername = (profile as any)?.username || (profile as any)?.gamer_tag;
    if (pUsername && !username) {
      setUsername(pUsername);
    }
  }, [profile, displayName, username]);

  // Webcam Helpers with automatic image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 120, 120, 0.7);
        setAvatar(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const captureSnapshot = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -160, 0, 160, 160);
        const rawShot = canvas.toDataURL('image/jpeg', 0.8);
        const compressed = await compressImage(rawShot, 120, 120, 0.7);
        setAvatar(compressed);
        stopWebcam();
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Step validation before advancing
  const handleNextStep = (currentStep: number) => {
    if (currentStep === 1) {
      const cleanName = displayName.trim();
      const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

      if (!cleanName) {
        toast.error('Please enter your Display Name');
        return;
      }
      if (!cleanUser) {
        toast.error('Please enter a Unique Username');
        return;
      }
      if (cleanUser.length < 3) {
        toast.error('Username must be at least 3 characters (letters, numbers, or underscores)');
        return;
      }
      if (usernameStatus === 'taken') {
        toast.error('This username @' + cleanUser + ' is already taken by another fighter.');
        return;
      }
      if (usernameStatus === 'checking') {
        toast.error('Checking username availability... Please wait.');
        return;
      }
    }
    setStep(currentStep + 1);
  };

  // Submit Final Onboarding Data Direct to Supabase Database & Auth Metadata
  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error('User session not found. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      const rawUserStr = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanUsername = rawUserStr.length >= 3 
        ? rawUserStr 
        : ((displayName || 'user').trim().toLowerCase().replace(/[^a-z0-9_]/g, '') + '_' + Math.floor(1000 + Math.random() * 9000));

      const compressedAvatar = await compressImage(avatar, 96, 96, 0.5);

      const onboardingPayload = {
        name: displayName.trim() || (profile as any)?.full_name || profile?.name || 'Focus Athlete',
        full_name: displayName.trim() || (profile as any)?.full_name || profile?.name || 'Focus Athlete',
        username: cleanUsername,
        gamer_tag: cleanUsername,
        avatar_url: compressedAvatar,
        daily_goal_minutes: Number(dailyGoal) || 120,
        primary_discipline: primaryGoal,
        preferred_stakes: preferredStakes,
        ai_coach_persona: coachPersona,
        sound_effects: soundEffects,
        leaderboard_privacy: leaderboardPrivacy,
        camera_verified: cameraVerified,
        has_seen_onboarding: true,
        xp: ((profile as any)?.xp || 0) + 250,
      };

      // 1. Instantly update React context state
      updateProfileLocally(onboardingPayload as any);

      // 2. User-scoped Local Storage backup for zero-lag route guarding
      if (typeof window !== 'undefined' && user?.id) {
        try {
          localStorage.setItem(`cronobash_has_seen_onboarding_${user.id}`, 'true');
          localStorage.setItem(`cronobash_user_onboarding_data_${user.id}`, JSON.stringify(onboardingPayload));
          // Clean legacy global keys so they never contaminate other user accounts
          localStorage.removeItem('cronobash_has_seen_onboarding');
          localStorage.removeItem('cronobash_user_onboarding_data');
        } catch (err) {}
      }

      // 3. Direct Supabase Database Write to public.users table
      const { error: dbError } = await supabase
        .from('users')
        .update(onboardingPayload)
        .eq('id', user.id);

      if (dbError) {
        console.warn('Database update warning, trying core fields fallback:', dbError.message);
        await supabase
          .from('users')
          .update({
            name: onboardingPayload.name,
            full_name: onboardingPayload.full_name,
            username: onboardingPayload.username,
            gamer_tag: onboardingPayload.gamer_tag,
            avatar_url: onboardingPayload.avatar_url,
            daily_goal_minutes: onboardingPayload.daily_goal_minutes,
            has_seen_onboarding: true,
          })
          .eq('id', user.id);
      }

      // 3. Direct Supabase Auth metadata write
      try {
        await supabase.auth.updateUser({
          data: onboardingPayload
        });
      } catch (authErr) {
        console.warn('Supabase auth metadata update warning:', authErr);
      }

      // 4. Refresh Profile directly from Supabase DB into React Context
      await refreshProfile();

      toast.success('Onboarding complete! Profile saved to Supabase! 🚀');
      router.replace('/dashboard');
    } catch (e: any) {
      console.error('Onboarding submit error:', e);
      toast.error('Error saving onboarding profile to Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFC] text-slate-900 min-h-screen flex flex-col justify-between font-sans selection:bg-slate-900 selection:text-white relative overflow-hidden">
      
      {/* Interactive Mouse-Following Video Background */}
      <InteractiveAuthBackground totalFrames={220} />

      {/* Top Header - Matches Login & Signup Header */}
      <header className="relative z-10 w-full flex justify-between items-center px-6 md:px-12 py-6 max-w-[1280px] mx-auto">
        <Link href="/" className="select-none">
          <span
            className="text-[28px] text-black leading-none select-none"
            style={{ fontFamily: '"Special Elite", serif', fontWeight: 400 }}
          >
            CronoBash
          </span>
        </Link>

        <div className="text-xs font-mono font-bold text-slate-500 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          STEP {step} / 6
        </div>
      </header>

      {/* Main Centered Onboarding Card - EXACT MAX-W-[340PX] AS LOGIN & SIGNUP */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-3 py-6">
        <div className="w-full max-w-[340px] bg-white/75 backdrop-blur-2xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)] relative">
          
          <AnimatePresence mode="wait">
            
            {/* ── STEP 1: IDENTITY & AVATAR ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="text-left">
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 1 of 6 · Profile Setup
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Your Athlete Handle
                  </h1>
                  <p className="text-xs text-slate-500">Set your display name and avatar.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="onboarding-display-name" className="text-[11px] font-bold text-slate-700 block mb-1">Display Name</label>
                    <input
                      id="onboarding-display-name"
                      name="display_name"
                      autoComplete="name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white/60 border border-slate-200/80 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="onboarding-username" className="text-[11px] font-bold text-slate-700 block mb-1">Unique Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">@</span>
                      <input
                        id="onboarding-username"
                        name="username"
                        autoComplete="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => checkUsernameAvailability(e.target.value)}
                        placeholder="focus_master"
                        className={`w-full bg-white/60 border rounded-xl py-2.5 pl-8 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white outline-none transition-all ${
                          usernameStatus === 'available'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                            : usernameStatus === 'taken'
                            ? 'border-red-500 ring-2 ring-red-500/10'
                            : 'border-slate-200/80 focus:border-slate-900'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {usernameStatus === 'checking' && (
                          <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {usernameStatus === 'available' && (
                          <span className="text-emerald-600 font-extrabold text-xs">✓</span>
                        )}
                        {usernameStatus === 'taken' && (
                          <span className="text-red-500 font-extrabold text-xs">✕</span>
                        )}
                      </div>
                    </div>
                    {usernameError ? (
                      <p className="text-[10px] text-red-500 font-bold mt-1">{usernameError}</p>
                    ) : usernameStatus === 'available' ? (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ @{username} is available!</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Users worldwide can search and connect with you using @username.</p>
                    )}
                  </div>

                  {/* Compact Avatar Selection */}
                  <div>
                    <label htmlFor="onboarding-avatar-file" className="text-[11px] font-bold text-slate-700 block mb-1.5">Avatar Icon</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border-2 border-slate-900 p-0.5 bg-slate-50 shrink-0">
                        <img src={avatar} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                      </div>
                      
                      <div className="flex gap-1.5">
                        {presetAvatars.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatar(p)}
                            className={`w-8 h-8 rounded-lg border p-0.5 overflow-hidden transition-all ${
                              avatar === p ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <img src={p} alt={`Preset ${idx}`} className="w-full h-full rounded-md object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <label htmlFor="onboarding-avatar-file" className="text-[10px] font-bold text-slate-700 bg-white/80 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">photo_library</span>
                        Photo
                        <input id="onboarding-avatar-file" name="avatar_file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>

                      <button
                        type="button"
                        onClick={webcamActive ? stopWebcam : startWebcam}
                        className="text-[10px] font-bold text-slate-700 bg-white/80 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">videocam</span>
                        {webcamActive ? 'Stop' : 'Snap'}
                      </button>
                    </div>

                    {webcamActive && (
                      <div className="mt-2 relative w-full h-28 bg-black rounded-lg overflow-hidden border border-slate-200 flex flex-col justify-end p-2">
                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="relative z-10 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded"
                        >
                          Snap Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleNextStep(1)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm active:scale-[0.99]"
                  >
                    <span>Next: Focus Goals</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: DAILY FOCUS GOALS ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 text-left"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 2 of 6 · Daily Target
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Daily Goal
                  </h1>
                  <p className="text-xs text-slate-500">Select target focus minutes per day.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Focus Minutes / Day</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[60, 120, 180, 240].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDailyGoal(m)}
                          className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                            dailyGoal === m
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                          }`}
                        >
                          <div className="text-xs font-black">{m} mins</div>
                          <div className="text-[9px] opacity-75 font-normal">{(m / 60).toFixed(1)} hrs/day</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Primary Discipline</label>
                    <div className="space-y-1.5">
                      {[
                        'Engineering & Code',
                        'NEET / JEE & Competitive',
                        'Science & Medical',
                        'Design & Creatives',
                      ].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPrimaryGoal(cat)}
                          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                            primaryGoal === cat
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 border border-slate-200 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-1 shadow-sm active:scale-[0.99]"
                  >
                    <span>Next: Matchmaking</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: MATCHMAKING & ARENA PREFERENCES ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 text-left"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 3 of 6 · Arena Config
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Duel Stakes
                  </h1>
                  <p className="text-xs text-slate-500">Select default money match duel stakes.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { title: 'Casual Arena (Free XP)', desc: 'Zero money risk. Level badges.' },
                    { title: 'Micro-Stakes (₹10 - ₹50)', desc: 'Low stakes duels. Quick payouts.' },
                    { title: 'High-Stakes (₹100+)', desc: 'High stakes 1v1 duels.' },
                  ].map((stk) => (
                    <button
                      key={stk.title}
                      type="button"
                      onClick={() => setPreferredStakes(stk.title)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        preferredStakes === stk.title
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{stk.title}</div>
                      <div className={`text-[10px] mt-0.5 ${preferredStakes === stk.title ? 'text-slate-300' : 'text-slate-500'}`}>
                        {stk.desc}
                      </div>
                    </button>
                  ))}

                  <div className="flex items-center justify-between p-3 bg-white/60 border border-slate-200/80 rounded-xl mt-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Camera AI Verification</div>
                      <div className="text-[10px] text-slate-500">AI gaze tracking in duels</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCameraVerified(!cameraVerified)}
                      className={`w-10 h-5.5 rounded-full transition-colors p-0.5 ${
                        cameraVerified ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${cameraVerified ? 'translate-x-4.5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 border border-slate-200 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-1 shadow-sm active:scale-[0.99]"
                  >
                    <span>Next: AI Coach</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: AI COACH PERSONA ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 text-left"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 4 of 6 · Companion
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    AI Coach Persona
                  </h1>
                  <p className="text-xs text-slate-500">Select your accountability AI tone.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'Drill Sergeant', desc: 'Strict, aggressive, zero excuses.' },
                    { name: 'Zen Master', desc: 'Calm, mindful flow state guide.' },
                    { name: 'Performance Strategist', desc: 'Data-driven and analytical.' },
                  ].map((coach) => (
                    <button
                      key={coach.name}
                      type="button"
                      onClick={() => setCoachPersona(coach.name)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        coachPersona === coach.name
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{coach.name}</div>
                      <div className={`text-[10px] mt-0.5 ${coachPersona === coach.name ? 'text-slate-300' : 'text-slate-500'}`}>
                        {coach.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 border border-slate-200 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-1 shadow-sm active:scale-[0.99]"
                  >
                    <span>Next: Settings</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: NOTIFICATIONS & PRIVACY ── */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 text-left"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 5 of 6 · System
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Preferences
                  </h1>
                  <p className="text-xs text-slate-500">Customize sound feedback & privacy.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Timer Sound Effects</label>
                    <div className="space-y-1.5">
                      {['Mechanical Key Clicks', 'Lofi Chill Beats', 'Silent Ambient'].map((snd) => (
                        <button
                          key={snd}
                          type="button"
                          onClick={() => setSoundEffects(snd)}
                          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                            soundEffects === snd
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                          }`}
                        >
                          {snd}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Leaderboard Privacy</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Public Profile', 'Squad Only'].map((priv) => (
                        <button
                          key={priv}
                          type="button"
                          onClick={() => setLeaderboardPrivacy(priv)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                            leaderboardPrivacy === priv
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white/60 text-slate-700 border-slate-200/80 hover:border-slate-400'
                          }`}
                        >
                          {priv}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-1/3 border border-slate-200 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-1 shadow-sm active:scale-[0.99]"
                  >
                    <span>Next: Claim Bonus</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 6: WELCOME BONUS & LAUNCH DASHBOARD ── */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                    Step 6 of 6 · Starter Pack
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Rig Ready!
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    +250 Bonus XP Credited!
                  </p>
                </div>

                {/* Configuration Summary */}
                <div className="bg-white/60 border border-slate-200/80 rounded-xl p-3 text-left space-y-1.5 text-[11px]">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500 font-medium">Athlete:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{displayName || 'Focus Athlete'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500 font-medium">Daily Goal:</span>
                    <span className="font-bold text-slate-900">{dailyGoal} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">AI Coach:</span>
                    <span className="font-bold text-slate-900">{coachPersona}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    disabled={loading}
                    onClick={handleFinalSubmit}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 px-4 text-xs font-extrabold flex justify-center items-center gap-1.5 shadow-md active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>{loading ? 'Entering...' : 'Enter Dashboard'}</span>
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  </button>

                  {!loading && (
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors block mx-auto pt-1"
                    >
                      Review Settings
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

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
