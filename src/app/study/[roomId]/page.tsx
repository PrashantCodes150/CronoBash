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
    toast.error("You forfeited the match! Marked as DEFEAT 💀", { icon: '💀', duration: 6000 });
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
    faceDetected: cameraActive && isSelfFocused
  });

  // Sound Synth Synthesizer
  const toggleAmbientSound = () => {
    if (ambientAudio) {
      oscNodesRef.current.forEach(osc => osc.stop());
      oscNodesRef.current = [];
      setAmbientAudio(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.connect(ctx.destination);
        gainNodeRef.current = gainNode;

        const freqs = [220, 277.18, 329.63, 440];
        const oscs = freqs.map(f => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.connect(gainNode);
          osc.start();
          return osc;
        });

        oscNodesRef.current = oscs;
        setAmbientAudio(true);
      } catch (e) {
        console.error("Audio error:", e);
      }
    }
  };

  // Fetch Room Info
  useEffect(() => {
    const fetchRoom = async () => {
      setLoadingRoom(true);
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (error || !data) {
          toast.error("Room not found.");
          router.push('/rooms');
          return;
        }

        setRoom(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [roomId, router]);

  // Request Camera Access
  useEffect(() => {
    if (isSpectator) return;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.warn("Camera access denied or unavailable:", err);
        setCameraActive(false);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isSpectator]);

  // Update Focus State from MediaPipe hook
  useEffect(() => {
    if (!cameraActive || isSpectator || sessionConcluded) return;

    const focused = focusDetector.isFocused;
    setIsSelfFocused(focused);
    broadcastFocusState(focused, distractionCount, false, focusScore);

    if (!focused) {
      setDistractionCount(prev => prev + 1);
      setFocusScore(prev => Math.max(0, prev - 2));
    }
  }, [focusDetector.isFocused]);

  // Sprint Timer Countdown interval
  useEffect(() => {
    if (sessionConcluded || isSpectator) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionConcluded(true);
          endSessionBroadcast();
          saveStudySession();
          return 0;
        }
        return prev - 1;
      });

      if (isSelfFocused) {
        setActiveFocusSeconds(prev => prev + 1);
      }

      // Record timeline every 10 seconds
      if (secondsRemaining % 10 === 0) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setFocusTimeline(prev => [...prev.slice(-15), { time: timeStr, level: focusScore }]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, sessionConcluded, isSpectator, isSelfFocused, focusScore]);

  // Key event listeners
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' && !showOnboarding) {
      setShowOnboarding(false);
    }
  };

  const getSortedStandings = () => {
    const standingsInput = members.map(m => ({
      userId: m.user_id,
      userName: m.users?.name || 'Studier',
      avatarUrl: m.users?.avatar_url || undefined,
      focusSeconds: m.user_id === user?.id ? activeFocusSeconds : (m.total_focus_seconds_today || 0),
      distractionCount: m.distractionCount || 0
    }));
    return computeStandings(standingsInput, room?.type || 'public', room?.entry_fee || 0);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loadingRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#ECEFF6] p-8">
        <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-sm mt-4 tracking-wide">CONNECTING TO LIVE NEURAL ARENA...</p>
      </div>
    );
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="min-h-screen bg-[#ECEFF6] text-slate-900 font-sans p-3 sm:p-5 md:p-6 rounded-[32px] space-y-6 select-none outline-none"
    >
      <Toaster position="top-right" toastOptions={{ className: 'bg-white border border-slate-200 text-slate-900 font-bold text-xs shadow-lg' }} />

      {/* Hidden self-video feed */}
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

      {/* ── TOP ARENA HEADER BAR ── */}
      <header className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-xl">fit_screen</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900">{room?.name || 'Live Focus Arena'}</h1>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Live Neural Study Arena</p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2 flex items-center gap-2.5 shadow-inner">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Time Remaining</span>
            <span className="text-xl font-black font-mono text-[#3B82F6]">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <button
            onClick={toggleAmbientSound}
            className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
              ambientAudio ? 'bg-[#10B981] text-white border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Ambient Audio Synth"
          >
            <span className="material-symbols-outlined text-base">{ambientAudio ? 'volume_up' : 'volume_off'}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN LIVE ARENA STREAM GRID & CONTROLS ── */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Video Stream Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
          <div className="morphism-card bg-white p-4 rounded-[28px] border border-white/80 shadow-sm min-h-[440px]">
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
          </div>

          {/* Quick Emotes Dock & Microphone Control */}
          <div className="morphism-card bg-white p-4 rounded-[24px] border border-white/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['👍', '🔥', '💡', '👏', '🎯'].map(emote => (
                <button
                  key={emote}
                  onClick={() => sendEmote(emote)}
                  className="text-lg hover:scale-125 transition-transform p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer shadow-sm"
                >
                  {emote}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSelfMuted(!isSelfMuted)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isSelfMuted 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{isSelfMuted ? 'mic_off' : 'mic'}</span>
                <span>{isSelfMuted ? 'Mic Muted' : 'Mic Live 🎙️'}</span>
              </button>

              <button
                onClick={handleForfeitMatch}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">flag</span>
                <span>Forfeit Match</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & AI Coach Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Focus Timeline Chart */}
          <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#3B82F6] font-bold">show_chart</span>
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Live Focus Index</h3>
            </div>
            <FocusScoreChart data={focusTimeline} />
          </div>

          {/* AI Coach Settings Panel */}
          <div className="morphism-card bg-white p-5 rounded-[28px] border border-white/80 shadow-sm">
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
          </div>

        </div>

      </main>

    </div>
  );
}
