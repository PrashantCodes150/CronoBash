"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { useRoomEvents } from '@/hooks/useRoomEvents';
import { useFocusDetection } from '@/lib/useFocusDetection';
import RoomGrid from '@/components/study/RoomGrid';
import { useCameraStream } from '@/hooks/useCameraStream';
import { useAICoach } from '@/hooks/useAICoach';
import { AICoachSettings } from '@/components/study/AICoachSettings';
import { generateSummary } from '@/utils/generateSummary';
import OnboardingModal from '@/components/study/OnboardingModal';
import CelebrationScreen from '@/components/study/CelebrationScreen';
import FocusScoreChart from '@/components/study/FocusScoreChart';
import { computeStandings } from '@/lib/focusUtils';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Volume2, VolumeX, Eye, ShieldAlert,
  Flame, Sliders, Moon, Leaf, Heart, Droplet, HelpCircle
} from 'lucide-react';

interface ChartPoint {
  time: string;
  level: number;
}

export default function StudyRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const { user, profile, refreshWallet } = useAuth();

  // Query configuration params
  const isSpectator = searchParams.get('spectator') === 'true';
  const initialTheme = searchParams.get('theme') || 'dark';

  // Room states
  const [room, setRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // AI Coach Configuration settings
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [coachVolume, setCoachVolume] = useState(80);
  const [coachLanguage, setCoachLanguage] = useState('hi-IN');
  const [coachCustomMessage, setCoachCustomMessage] = useState('');

  // User onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Camera stream and detection states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isSelfMuted, setIsSelfMuted] = useState(false);

  // Focus and Distraction state
  const [isSelfFocused, setIsSelfFocused] = useState(true);
  const [distractionCount, setDistractionCount] = useState(0);
  const [focusTimeline, setFocusTimeline] = useState<ChartPoint[]>([]);
  const [activeFocusSeconds, setActiveFocusSeconds] = useState(0);
  const [focusScore, setFocusScore] = useState(100);

  // Time Limit Countdown
  const [secondsRemaining, setSecondsRemaining] = useState(1500); // 25 min default
  const [sessionConcluded, setSessionConcluded] = useState(false);

  const secondsRemainingRef = useRef(1500);
  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  const activeFocusSecondsRef = useRef(0);
  useEffect(() => {
    activeFocusSecondsRef.current = activeFocusSeconds;
  }, [activeFocusSeconds]);

  const saveStudySession = async () => {
    if (!user || isSpectator) return;
    try {
      const elapsed = 1500 - secondsRemainingRef.current;
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          room_id: roomId,
          start_time: new Date(Date.now() - elapsed * 1000).toISOString(),
          end_time: new Date().toISOString(),
          focus_seconds: activeFocusSecondsRef.current,
          total_seconds: elapsed || 1,
          name: room?.name || 'Study Battle'
        });
      if (error) throw error;
      toast.success("Study session saved successfully!");

      // Update Points & Levels
      const elapsedMinutes = Math.max(1, Math.floor((elapsed || 1) / 60));
      const roomType = room?.type || 'private';
      const standings = getSortedStandings();
      const myStanding = standings.find(s => s.userId === user.id);
      const isWinner = myStanding?.rank === 1;

      let ptsEarned = 0;
      let pointsLost = 0;

      if (roomType === 'money') {
        ptsEarned = elapsedMinutes * 100 + (isWinner ? 500 : 0);
      } else if (roomType === 'public') {
        ptsEarned = elapsedMinutes * 25 + (isWinner ? 150 : 0);
      } else {
        ptsEarned = elapsedMinutes * 10;
      }

      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('points, level')
        .eq('id', user.id)
        .single();

      if (!userFetchError && userData) {
        const currentPoints = userData.points || 0;
        const currentLevel = userData.level || 1;
        let newPoints = currentPoints + ptsEarned;

        // Level depletion rules if level >= 70 and didn't win
        if (currentLevel >= 70 && !isWinner) {
          if (roomType === 'money') {
            pointsLost = 1000;
          } else if (roomType === 'public') {
            pointsLost = 300;
          } else {
            pointsLost = 100;
          }
          newPoints = Math.max(0, newPoints - pointsLost);
        }

        const { getLevelFromPoints, getEarnedBadgesForLevel } = await import('@/lib/levelUtils');
        const newLevel = getLevelFromPoints(newPoints);
        const newBadges = getEarnedBadgesForLevel(newLevel);

        await supabase
          .from('users')
          .update({
            points: newPoints,
            level: newLevel,
            badges: newBadges
          })
          .eq('id', user.id);

        if (pointsLost > 0) {
          toast.error(`Defeat! Lost ${pointsLost} XP. Level: ${newLevel}`, { duration: 5000 });
        } else {
          toast.success(`Victory! Gained ${ptsEarned} XP. Level: ${newLevel}`, { duration: 5000 });
        }
      }
    } catch (err) {
      console.error("Error saving study session:", err);
    }
  };

  // Themes
  const [activeTheme, setActiveTheme] = useState(initialTheme);

  // Sound Synth state
  const [ambientAudio, setAmbientAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<any[]>([]);

  // Import Focus Detection hook
  const focusDetector = useFocusDetection({
    videoRef,
    enabled: cameraActive && !isSpectator && !sessionConcluded && onboardingChecked,
    detectionInterval: 1000
  });

  // Supabase Realtime Synchronization Hook
  const {
    members,
    sendEmote,
    broadcastFocusState,
    broadcastMuteState,
    endSessionBroadcast
  } = useRoomEvents({
    roomId,
    userId: user?.id || '',
    userName: profile?.name || user?.email?.split('@')[0] || 'Studier',
    isSpectator,
    onSessionEnded: () => {
      setSessionConcluded(true);
      saveStudySession();
    },
    onOpponentDistracted: (oppName, strikes) => {
      // Event handler if needed
    }
  });

  // WebRTC Camera Video Streaming Hook
  const opponentIds = members.filter(m => m.user_id !== user?.id).map(m => m.user_id);
  const { remoteStreams } = useCameraStream(
    roomId,
    user?.id || '',
    opponentIds,
    localStream
  );

  // AI Coach Audio Warnings trigger hook
  useAICoach({
    enabled: coachEnabled && !isSpectator && !sessionConcluded && onboardingChecked,
    volume: coachVolume,
    language: coachLanguage,
    customMessage: coachCustomMessage,
    isFocused: isSelfFocused,
    distractionCount: distractionCount,
    faceDetected: focusDetector.faceDetected
  });

  // Verify wallet balance / invitation code rules
  useEffect(() => {
    if (!roomId || !user) return;

    const verifyAccessAndLoad = async () => {
      setLoadingRoom(true);
      try {
        // Fetch room
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          setAccessDenied('Room not found or has been closed.');
          return;
        }

        setRoom(roomData);

        // Check if money room
        if (roomData.type === 'money') {
          // Check user wallet
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

          if (walletError || !walletData || walletData.balance < roomData.entry_fee) {
            setAccessDenied(`Insufficient wallet balance. Entry fee is ₹${roomData.entry_fee}.`);
            return;
          }

          // In production, we invoke edge function to lock escrow. 
          // Here, we simulate by checking balance.
        }

        // Check onboarding flag
        const onboardingSeen = localStorage.getItem(`onboarding_seen_${user.id}`);
        if (!onboardingSeen && !profile?.has_seen_onboarding) {
          setShowOnboarding(true);
        } else {
          setOnboardingChecked(true);
        }
      } catch (err) {
        console.error(err);
        setAccessDenied('Authentication or connection failed.');
      } finally {
        setLoadingRoom(false);
      }
    };

    verifyAccessAndLoad();
  }, [roomId, user, profile]);

  // Handle local camera stream initialization
  useEffect(() => {
    if (!onboardingChecked || isSpectator || sessionConcluded) return;

    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        setLocalStream(stream);
        setCameraActive(true);
        // Bind video tag for focus detection
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not capture webcam stream:", err);
        toast.error("Webcam is required for focus scanning!");
      }
    };

    getCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onboardingChecked, isSpectator, sessionConcluded]);

  // Track Gaze/Focus state changes and strikes
  const streakRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSpectator || sessionConcluded) return;

    const currentFocus = focusDetector.isFocused;
    setIsSelfFocused(currentFocus);

    if (!currentFocus && focusDetector.faceDetected) {
      // Distracted: Start 3-second strike debouncer
      if (!debounceTimerRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          setDistractionCount(prev => {
            const next = prev + 1;
            // Play alarm beep
            playAlertSound();
            toast.error(`Distraction detected! Strike ${next}/5`, { icon: '⚡' });
            
            if (next >= 5) {
              toast.error("Eliminated from room due to 5 strikes!");
              endSessionBroadcast();
              setSessionConcluded(true);
              saveStudySession();
            }
            return next;
          });
          debounceTimerRef.current = null;
        }, 3000);
      }
    } else {
      // Focused again: clear debouncer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [focusDetector.isFocused, isSpectator, sessionConcluded]);

  // Real-time synchronization broadcaster loop
  useEffect(() => {
    if (isSpectator || sessionConcluded) return;
    const interval = setInterval(() => {
      broadcastFocusState(isSelfFocused, distractionCount);

      // Increment active focus seconds
      if (isSelfFocused) {
        setActiveFocusSeconds(prev => prev + 1);
      }

      // Append chart point
      setFocusTimeline(prev => {
        const nextScore = isSelfFocused ? Math.min(100, focusScore + 1) : Math.max(0, focusScore - 5);
        setFocusScore(nextScore);
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        return [...prev.slice(-30), { time: timeStr, level: nextScore }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSelfFocused, distractionCount, focusScore, isSpectator, sessionConcluded]);

  // Session timer countdown tick
  useEffect(() => {
    if (sessionConcluded) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionConcluded(true);
          saveStudySession();
          // Broadcast end session to everyone in case you are owner
          if (room?.owner_id === user?.id) {
            endSessionBroadcast();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionConcluded, room, user]);

  // Synced synth nodes generator (Web Audio API)
  const toggleAmbientSound = () => {
    if (typeof window === 'undefined') return;

    if (ambientAudio) {
      // Stop all oscillators
      oscNodesRef.current.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      oscNodesRef.current = [];
      setAmbientAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      // Theme frequencies configuration
      const freqs = activeTheme === 'pink' ? [220, 275, 330] : activeTheme === 'green' ? [180, 240, 320] : [110, 165, 220];
      
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Add low frequency oscillator (LFO) for wave modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // very slow mod
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gain);
        osc.start();
        lfo.start();
        oscNodesRef.current.push(osc);
        oscNodesRef.current.push(lfo);
      });

      setAmbientAudio(true);
    } catch (e) {
      console.error(e);
    }
  };

  const playAlertSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard Simulation key handler for quick testing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSpectator || sessionConcluded) return;
    if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'd') {
      // Simulate distraction strike instantly
      setDistractionCount(prev => {
        const next = prev + 1;
        playAlertSound();
        toast.error(`[SIMULATED] Strike triggered! strike ${next}/5`, { icon: '⚡' });
        return next;
      });
    }
  };

  if (loadingRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs tracking-widest text-neutral-400">CONNECTING COGNISWEEP ROUTER...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
        <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">{accessDenied}</p>
          <button
            onClick={() => router.push('/rooms')}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-mono font-semibold uppercase tracking-wider transition-colors"
          >
            Return to Lobbies
          </button>
        </div>
      </div>
    );
  }

  // Standings data assembler for CelebrationScreen
  const getSortedStandings = () => {
    const playersList = members.map(m => ({
      userId: m.user_id,
      userName: m.users?.name || 'Studier',
      avatarUrl: m.users?.avatar_url || undefined,
      focusSeconds: m.user_id === user?.id ? activeFocusSeconds : (m.total_focus_seconds_today || 600),
      distractionCount: m.user_id === user?.id ? distractionCount : (m.distractionCount || 0)
    }));

    return computeStandings(playersList, room.type, room.entry_fee, room.platform_fee_percent);
  };

  // Map theme strings to background CSS
  const getThemeBackground = () => {
    switch (activeTheme) {
      case 'pink':
        return 'bg-gradient-to-tr from-neutral-950 via-purple-950/20 to-neutral-950 border-purple-900/20';
      case 'green':
        return 'bg-gradient-to-tr from-neutral-950 via-emerald-950/20 to-neutral-950 border-emerald-900/20';
      case 'water':
        return 'bg-gradient-to-tr from-neutral-950 via-cyan-950/20 to-neutral-950 border-cyan-900/20';
      default:
        return 'bg-neutral-950';
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`min-h-screen flex flex-col transition-all duration-700 outline-none select-none ${getThemeBackground()} text-white`}
    >
      <Toaster position="top-right" toastOptions={{ className: 'bg-neutral-900 border border-neutral-800 text-white font-mono text-xs' }} />

      {/* Hidden self-video feed for off-screen analysis */}
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* 1. Onboarding Overlay */}
      {showOnboarding && user && (
        <OnboardingModal
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingChecked(true);
          }}
        />
      )}

      {/* 2. Celebration Screen Overlay */}
      {sessionConcluded && (
        <CelebrationScreen
          roomName={room?.name || 'Lobby'}
          roomType={room?.type || 'public'}
          standings={getSortedStandings()}
          summary={generateSummary({ focusPercent: focusScore, distractionCount })}
          onRematch={() => {
            setDistractionCount(0);
            setSecondsRemaining(1500);
            setSessionConcluded(false);
          }}
          onLeave={() => {
            router.push('/rooms');
          }}
        />
      )}

      {/* Header bar */}
      <header className="px-6 py-4 border-b border-neutral-900 bg-neutral-950/40 backdrop-blur flex flex-wrap items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black font-sans tracking-wide text-white">{room?.name}</h1>
          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${room?.type === 'money' ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' : room?.type === 'private' ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' : 'text-neutral-400 bg-neutral-900 border-neutral-800'}`}>
            {room?.type} ARENA
          </span>
        </div>

        {/* Dynamic Timer Display */}
        <div className="flex items-center gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg px-4 py-1.5 flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-500">TIME REMAINING</span>
            <span className="text-lg font-black font-mono tracking-widest text-emerald-400 animate-pulse">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Ambient controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAmbientSound}
            className={`p-2 rounded-lg border transition-all ${ambientAudio ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
            title="Toggle Focus Sound Synth"
          >
            {ambientAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Stream layout */}
      <main className="flex-grow flex flex-col md:flex-row relative">
        
        {/* Left Side: Video feeds */}
        <div className="flex-grow flex flex-col justify-between overflow-hidden">
          {user && (() => {
            const streamsMap = new Map<string, MediaStream | null>();
            streamsMap.set(user.id, localStream);
            if (remoteStreams) {
              remoteStreams.forEach((stream, uid) => {
                streamsMap.set(uid, stream);
              });
            }
            const formattedMembers = members.map(m => ({
              id: m.user_id,
              name: m.users?.name || 'Studier',
              avatarUrl: m.users?.avatar_url || undefined,
              isFocused: m.isFocused,
              isMuted: m.isMuted,
              distractionCount: m.distractionCount,
              isSpectator: m.isSpectator
            }));
            return (
              <RoomGrid
                members={formattedMembers}
                streams={streamsMap}
                selfId={user.id}
              />
            );
          })()}

          {/* Quick emotes dock */}
          <div className="p-4 bg-neutral-950/60 border-t border-neutral-900 flex justify-center items-center gap-3">
            {['👍', '🔥', '😴', '💡', '👏', '🎯'].map(emote => (
              <button
                key={emote}
                onClick={() => sendEmote(emote)}
                className="text-xl hover:scale-125 transition-transform p-2 bg-neutral-900 hover:bg-neutral-850 rounded-lg border border-neutral-800/50"
              >
                {emote}
              </button>
            ))}
            <div className="h-6 w-px bg-neutral-800 mx-2" />
            <button
              onClick={() => setIsSelfMuted(!isSelfMuted)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${isSelfMuted ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
            >
              {isSelfMuted ? 'Muted' : 'Unmuted'}
            </button>
          </div>
        </div>

        {/* Right Side: Focus Stats chart & Theme configuration panel */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-900 bg-neutral-950/40 p-4 space-y-6 flex flex-col justify-start">
          
          {/* Timeline chart */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-neutral-400 font-mono tracking-wider">FOCUS INDEX</h2>
            <FocusScoreChart data={focusTimeline} />
          </div>

          {/* Theme selector */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-neutral-400 font-mono tracking-wider">ARENA ENVIROMENT</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTheme('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${activeTheme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Moon className="w-4 h-4" />
                Dark Theme
              </button>
              <button
                onClick={() => setActiveTheme('green')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${activeTheme === 'green' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Leaf className="w-4 h-4" />
                Green Forest
              </button>
              <button
                onClick={() => setActiveTheme('pink')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${activeTheme === 'pink' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Heart className="w-4 h-4" />
                Pink Petals
              </button>
              <button
                onClick={() => setActiveTheme('water')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${activeTheme === 'water' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Droplet className="w-4 h-4" />
                Water Flow
              </button>
          </div>
        </div>

          {/* AI Coach Settings Panel */}
          <AICoachSettings
            coachEnabled={coachEnabled}
            setCoachEnabled={setCoachEnabled}
            volume={coachVolume}
            setVolume={setCoachVolume}
            language={coachLanguage}
            setLanguage={setCoachLanguage}
            customMessage={coachCustomMessage}
            setCustomMessage={setCoachCustomMessage}
          />

          {/* Quick Tips */}
          <div className="bg-neutral-900/40 border border-neutral-800 p-3 rounded-lg text-xs leading-relaxed text-neutral-400 font-sans space-y-2">
            <span className="font-semibold text-white flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              Focus Simulation Tips
            </span>
            <p>
              Don't have multiple webcams? You can press <kbd className="bg-neutral-950 px-1 border border-neutral-800 rounded font-mono text-white text-[10px]">H</kbd> or <kbd className="bg-neutral-950 px-1 border border-neutral-800 rounded font-mono text-white text-[10px]">D</kbd> on your keyboard to instantly simulate a distraction strike!
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
