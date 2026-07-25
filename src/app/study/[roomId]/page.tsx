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
  Flame, Sliders, Moon, Leaf, Heart, Droplet, HelpCircle, RotateCcw, Mic, MicOff
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
  const initialDuration = Number(searchParams.get('durationMinutes')) || 25;
  const targetSeconds = initialDuration * 60;

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

  // Time Limit Countdown & Forfeit
  const [secondsRemaining, setSecondsRemaining] = useState(targetSeconds);
  const [sessionConcluded, setSessionConcluded] = useState(false);
  const [forfeitedUserId, setForfeitedUserId] = useState<string | null>(null);

  const secondsRemainingRef = useRef(targetSeconds);
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
      const elapsed = targetSeconds - secondsRemainingRef.current;
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

  const handleRemoteForfeit = (forfeitingId: string) => {
    setForfeitedUserId(forfeitingId);
    setSessionConcluded(true);
    saveStudySession();
    if (forfeitingId !== user?.id) {
      toast.success("Opponent forfeited the match! You WIN! 🏆", { icon: '🏆', duration: 6000 });
    }
  };

  // Real-time synchronization hook
  const {
    members,
    sendEmote,
    broadcastFocusState,
    broadcastMuteState,
    endSessionBroadcast,
    forfeitMatchBroadcast
  } = useRoomEvents({
    roomId,
    userId: user?.id || '',
    userName: profile?.name || user?.email?.split('@')[0] || 'Studier',
    isSpectator,
    onSessionEnded: () => {
      setSessionConcluded(true);
      saveStudySession();
    },
    onMatchForfeited: handleRemoteForfeit,
    onOpponentDistracted: (oppName, strikes) => {}
  });

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isSelfMuted;
      });
    }
    broadcastMuteState(isSelfMuted);
  }, [isSelfMuted, localStream]);

  const handleForfeitMatch = () => {
    if (!user || sessionConcluded) return;
    setForfeitedUserId(user.id);
    forfeitMatchBroadcast(user.id);
    setSessionConcluded(true);
    saveStudySession();
    toast.error("You forfeited the match! Marked as LOSER 💀", { icon: '💀', duration: 6000 });
  };

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

        if (roomData.type === 'money') {
          const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .maybeSingle();

          if (walletError || !walletData || walletData.balance < roomData.entry_fee) {
            setAccessDenied(`Insufficient token balance to enter this money match. Requires ${roomData.entry_fee} TKN.`);
            return;
          }
        }

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

    if (currentFocus) {
      streakRef.current += 1;
      if (streakRef.current % 5 === 0) {
        setActiveFocusSeconds(prev => prev + 5);
      }
      const scoreGain = Math.min(100, focusScore + 0.5);
      setFocusScore(scoreGain);
    } else {
      streakRef.current = 0;
      const scoreDrop = Math.max(0, focusScore - 1.5);
      setFocusScore(scoreDrop);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        setDistractionCount(prev => {
          const next = prev + 1;
          playAlertSound();
          toast.error(`Focus lost! Strike #${next}/5`, { icon: '⚡' });
          return next;
        });
      }, 2000);
    }

    broadcastFocusState(
      currentFocus, 
      distractionCount, 
      focusDetector.isFakeCam, 
      focusScore, 
      focusDetector.gazeScore, 
      focusDetector.poseStability
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setFocusTimeline(prev => {
      const updated = [...prev, { time: nowStr, level: currentFocus ? 1 : 0 }];
      return updated.slice(-30);
    });
  }, [focusDetector.isFocused, isSpectator, sessionConcluded]);

  // Countdown timer logic
  useEffect(() => {
    if (sessionConcluded) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionConcluded(true);
          saveStudySession();
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

  // Synced synth nodes generator
  const toggleAmbientSound = () => {
    if (typeof window === 'undefined') return;

    if (ambientAudio) {
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

      const freqs = activeTheme === 'pink' ? [220, 275, 330] : activeTheme === 'green' ? [180, 240, 320] : [110, 165, 220];
      
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSpectator || sessionConcluded) return;
    if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'd') {
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
        <p className="mt-4 text-xs tracking-widest text-neutral-400">CONNECTING CRONOBASH ROUTER...</p>
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
    const playersList = members.map(m => {
      const isForfeit = forfeitedUserId === m.user_id;
      return {
        userId: m.user_id,
        userName: m.users?.name || 'Studier',
        avatarUrl: m.users?.avatar_url || undefined,
        focusSeconds: m.user_id === user?.id ? activeFocusSeconds : (m.total_focus_seconds_today || 600),
        distractionCount: m.user_id === user?.id ? distractionCount : (m.distractionCount || 0),
        isForfeit
      };
    });

    let calculated = computeStandings(playersList, room?.type || 'public', room?.entry_fee || 0, room?.platform_fee_percent || 0);

    if (forfeitedUserId) {
      calculated = calculated.map(p => {
        if (p.userId === forfeitedUserId) {
          return { ...p, rank: 2, isForfeit: true };
        }
        return { ...p, rank: 1 };
      });
    }

    return calculated;
  };

  // Map theme strings to dynamic background CSS
  const getThemeBackground = () => {
    switch (activeTheme) {
      case 'pink':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-950 via-purple-950/40 to-neutral-950 border-purple-900/30';
      case 'green':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-green-950/40 to-neutral-950 border-emerald-900/30';
      case 'water':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950 via-blue-950/40 to-neutral-950 border-blue-900/30';
      default:
        return 'bg-neutral-950 bg-grid-pattern';
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
          currentUserId={user?.id}
          summary={generateSummary({ focusPercent: focusScore, distractionCount })}
          onRematch={() => {
            setDistractionCount(0);
            setSecondsRemaining(targetSeconds);
            setForfeitedUserId(null);
            setSessionConcluded(false);
          }}
          onLeave={() => {
            router.push('/rooms');
          }}
        />
      )}

      {/* Header bar */}
      <header className="px-6 py-4 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-surface-container backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 z-40 shadow-[0_0_25px_rgba(0,255,163,0.15)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(0,255,163,0.3)] animate-pulse">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-wide text-white bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent flex items-center gap-2">
              <span>{room?.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h1>
            <p className="text-[10px] text-emerald-300/80 font-mono">ACTIVE DEEP FOCUS SPRINT LOBBY</p>
          </div>
          <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border shadow-[0_0_10px_rgba(0,255,163,0.2)] ${
            room?.type === 'money' 
              ? 'text-amber-400 bg-amber-500/20 border-amber-500/40 font-bold' 
              : room?.type === 'private' 
                ? 'text-purple-300 bg-purple-500/20 border-purple-500/40 font-bold' 
                : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-bold'
          }`}>
            {room?.type} ARENA
          </span>
        </div>

        {/* Dynamic Timer Display */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-emerald-950/80 to-neutral-950/80 border border-emerald-500/40 rounded-2xl px-5 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,163,0.25)]">
            <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-wider">TIME REMAINING:</span>
            <span className="text-xl font-black font-mono tracking-widest text-emerald-400 animate-pulse drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Ambient & Theme controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAmbientSound}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              ambientAudio 
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(0,255,163,0.3)] animate-pulse' 
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle Focus Sound Synth"
          >
            {ambientAudio ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
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
              isMuted: m.user_id === user.id ? isSelfMuted : m.isMuted,
              distractionCount: m.distractionCount,
              focusScore: m.user_id === user.id ? focusScore : (m.focusScore !== undefined ? m.focusScore : Math.max(40, 100 - (m.distractionCount || 0) * 12)),
              focusSeconds: m.user_id === user.id ? activeFocusSeconds : (m.total_focus_seconds_today || 300),
              focusTimeline: m.user_id === user.id ? focusTimeline : [],
              isSpectator: m.isSpectator,
              gazeScore: m.user_id === user.id ? focusDetector.gazeScore : (m.gazeScore !== undefined ? m.gazeScore : 100),
              poseStability: m.user_id === user.id ? focusDetector.poseStability : (m.poseStability !== undefined ? m.poseStability : 100),
              level: profile?.level || 1
            }));
            return (
              <RoomGrid
                members={formattedMembers}
                streams={streamsMap}
                selfId={user.id}
              />
            );
          })()}

          {/* Quick emotes dock & Forfeit control */}
          <div className="p-4 bg-neutral-950/60 border-t border-neutral-900 flex flex-wrap justify-center items-center gap-3">
            {['👍', '🔥', '😴', '💡', '👏', '🎯'].map(emote => (
              <button
                key={emote}
                onClick={() => sendEmote(emote)}
                className="text-xl hover:scale-125 transition-transform p-2 bg-neutral-900 hover:bg-neutral-850 rounded-lg border border-neutral-800/50 cursor-pointer"
              >
                {emote}
              </button>
            ))}
            <div className="h-6 w-px bg-neutral-800 mx-2 hidden sm:block" />
            <button
              onClick={() => setIsSelfMuted(!isSelfMuted)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isSelfMuted 
                  ? 'bg-red-950/80 border-red-800 text-red-400 font-bold' 
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
              }`}
              title={isSelfMuted ? "Click to Unmute Microphone" : "Click to Mute Microphone"}
            >
              {isSelfMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                  <span>MIC MUTED</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>MIC LIVE 🎙️</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleForfeitMatch}
              className="px-3 py-1.5 rounded-lg border text-xs font-mono transition-all bg-red-950/60 border-red-800 text-red-400 hover:bg-red-900/80 hover:text-white cursor-pointer uppercase font-bold flex items-center gap-1.5 shadow-lg"
              title="Restarting or leaving forfeits the match immediately"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Match (Forfeit)
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
            <h2 className="text-xs font-semibold text-neutral-400 font-mono tracking-wider">ARENA ENVIRONMENT</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTheme('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${activeTheme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Moon className="w-4 h-4" />
                Cyberpunk Dark
              </button>
              <button
                onClick={() => setActiveTheme('green')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${activeTheme === 'green' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Leaf className="w-4 h-4" />
                Hacker Green
              </button>
              <button
                onClick={() => setActiveTheme('pink')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${activeTheme === 'pink' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
              >
                <Heart className="w-4 h-4" />
                Neon Pink
              </button>
              <button
                onClick={() => setActiveTheme('water')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${activeTheme === 'water' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
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
              Press <kbd className="bg-neutral-950 px-1 border border-neutral-800 rounded font-mono text-white text-[10px]">H</kbd> or <kbd className="bg-neutral-950 px-1 border border-neutral-800 rounded font-mono text-white text-[10px]">D</kbd> on your keyboard to instantly simulate a distraction strike!
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
