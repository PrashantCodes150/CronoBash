"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';

interface ChartPoint {
  time: string;
  level: number;
}

interface ModeLog {
  timestamp: string;
  mode: 'screen' | 'paper';
}

const motivationQuotes = [
  "LOCK IN: CONCENTRATION IS YOUR GREATEST WEAPON",
  "CYBERNETIC COGNITION IN PROGRESS. REMAIN FOCUSED",
  "NO CAMERAS, JUST BRAINPOWER. KEEP PUSHING",
  "THE ARENA REWARDS THE DISCIPLINED. FOCUS ON THE GOAL",
  "SILENT GRIND, DEAFENING RESULTS. LOG THOSE MINUTES",
  "SQUAD RUNNING IN STEALTH MODE. MAXIMIZE COGNITIVE LOAD",
  "CONQUER THE DISTRACTIONS. SECURE THE VICTORY",
  "YOUR BUDDY IS SPRINTING. DON'T LOSE GROUND NOW"
];

function StudySessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('roomId');
  
  const { user, profile, refreshProfile, refreshWallet } = useAuth();
  
  // Timer & Session state
  const [isActive, setIsActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  
  // Combined Screen + Paper Focus Metrics
  const [screenFocusSeconds, setScreenFocusSeconds] = useState(0);
  const [paperFocusSeconds, setPaperFocusSeconds] = useState(0);
  const [modeChanges, setModeChanges] = useState<ModeLog[]>([]);

  // Calibration state
  const [calibrated, setCalibrated] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0); // 0: not started, 1: top-left, 2: center, 3: bottom-right
  const [calibThresholds, setCalibThresholds] = useState({ left: -0.04, right: 0.04, down: 0.03 });

  // Webcam & Gaze states
  const [cameraActive, setCameraActive] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [focusScore, setFocusScore] = useState(100); // Starts at 100
  const [interruptions, setInterruptions] = useState(0);
  const [gazeDirection, setGazeDirection] = useState('Calibrating');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('theme') || 'dark';
    }
    return 'dark';
  });
  const [decayMultiplier, setDecayMultiplier] = useState(1.0);
  const [recoveryMultiplier, setRecoveryMultiplier] = useState(1.0);
  const [gazeSensitivity, setGazeSensitivity] = useState(1.0);

  // Web Audio Synthesizer states
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const synthNodesRef = useRef<any[]>([]);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [selectedAmbient, setSelectedAmbient] = useState<string>('dark');
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  // Arena Lobby & Sharing settings
  const [lobbyDeployed, setLobbyDeployed] = useState(true); // Bypass local study setup overlay as settings are configured in room lobby!
  const [shareCamera, setShareCamera] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('shareCamera') !== 'false';
    }
    return true;
  });
  const [shareGraphs, setShareGraphs] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('shareGraphs') !== 'false';
    }
    return true;
  });
  const [shareStats, setShareStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('shareStats') !== 'false';
    }
    return true;
  });
  const [playersCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return parseInt(sp.get('playersCount') || '2', 10);
    }
    return 2;
  });
  const [opponents, setOpponents] = useState<any[]>([]);
  const [forfeitAlerts, setForfeitAlerts] = useState<string[]>([]);

  // Particle Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { time: '0:00', level: 100 } // Starts at 100
  ]);
  const [streakChartData, setStreakChartData] = useState<any[]>([
    { time: '0:00', streak: 0 }
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraInstRef = useRef<any>(null);

  // WebRTC & Forfeit Refs and States
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const opponentVideoRef = useRef<HTMLVideoElement | null>(null);
  const opponentVideoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const webrtcChannelRef = useRef<any>(null);

  const [selfHandsDown, setSelfHandsDown] = useState(false);
  const [opponentHandsDown, setOpponentHandsDown] = useState(false);
  const [showResultsOverlay, setShowResultsOverlay] = useState(false);
  const [battleStatsResults, setBattleStatsResults] = useState<any[]>([]);
  const [battleWinnerName, setBattleWinnerName] = useState<string | null>(null);
  const [p1WinsCount, setP1WinsCount] = useState(0);
  const [p2WinsCount, setP2WinsCount] = useState(0);
  const [battleReason, setBattleReason] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active tasks for objective select
  useEffect(() => {
    const fetchActiveTasks = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false);
        if (data) setActiveTasks(data);
      } catch (err) {
        console.error("Failed to fetch active tasks:", err);
      }
    };
    fetchActiveTasks();
  }, [user]);

  // Ref mirrors so the interval callback always reads fresh values
  const isFocusedRef = useRef(true);
  const focusScoreRef = useRef(0);
  const gazeDirectionRef = useRef('Calibrating');
  const currentStreakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const secondsRef = useRef(0);
  const focusSecondsRef = useRef(0);
  const screenFocusSecondsRef = useRef(0);
  const paperFocusSecondsRef = useRef(0);
  const modeChangesRef = useRef<ModeLog[]>([]);

  // Load MediaPipe scripts dynamically from jsDelivr CDN
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        const cameraScript = document.createElement('script');
        cameraScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
        cameraScript.async = true;
        document.body.appendChild(cameraScript);

        const faceMeshScript = document.createElement('script');
        faceMeshScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
        faceMeshScript.async = true;
        document.body.appendChild(faceMeshScript);

        faceMeshScript.onload = () => {
          console.log("MediaPipe scripts loaded successfully.");
        };
      } catch (err) {
        console.error("Failed to load MediaPipe dependencies:", err);
      }
    };

    loadMediaPipe();

    return () => {
      if (cameraInstRef.current) {
        cameraInstRef.current.stop();
      }
    };
  }, []);

  const playTriumphFanfare = () => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) {
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Fanfare notes: C4, E4, G4, C5 in sequence
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.7);
      });
    } catch (err) {
      console.error("Failed to play synthesized fanfare:", err);
    }
  };

  const playVictorySound = () => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        
        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 1.3);
      });
    } catch (e) {
      console.error("Victory sound failed:", e);
    }
  };

  const playDefeatSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const notes = [392.00, 349.23, 311.13, 246.94, 196.00];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + index * 0.18);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + index * 0.18 + 0.7);
        
        gain.gain.setValueAtTime(0, now + index * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.9);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.18);
        osc.stop(now + index * 0.18 + 1.0);
      });
    } catch (e) {
      console.error("Defeat sound failed:", e);
    }
  };

  const startAmbientSynth = (type?: string) => {
    if (typeof window === 'undefined') return;
    
    const activeType = type || selectedAmbient;
    
    // Create AudioContext if it doesn't exist
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Ensure master gain node exists
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
    }
    masterGainRef.current.gain.setValueAtTime(ambientVolume, ctx.currentTime);
    
    // Stop any existing nodes first
    stopAmbientSynth();
    
    if (activeType === 'dark') {
      // Cosmic Drone: Detuned sawtooth waves
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(65.41, ctx.currentTime);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(65.81, ctx.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      
      osc1.connect(gain1);
      osc2.connect(gain1);
      gain1.connect(filter);
      filter.connect(masterGainRef.current);
      
      osc1.start();
      osc2.start();
      
      synthNodesRef.current = [osc1, osc2, gain1, filter];
    } else if (activeType === 'pink') {
      // Soothing Music: Gentle major7 chord progression (Fmaj7 -> Gmaj -> Em7 -> Am7)
      const chords = [
        [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        [196.00, 246.94, 293.66, 392.00], // Gmaj (G3, B3, D4, G4)
        [164.81, 196.00, 246.94, 329.63], // Em7 (E3, G3, B3, E4)
        [220.00, 261.63, 329.63, 392.00]  // Am7 (A3, C4, E4, G4)
      ];
      let chordIndex = 0;
      
      const playChord = () => {
        if (ctx.state === 'closed') return;
        const notes = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        
        notes.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          gain.gain.setValueAtTime(0.0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5); // slow attack
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8); // slow release
          
          osc.connect(gain);
          gain.connect(masterGainRef.current!);
          osc.start();
          osc.stop(ctx.currentTime + 4);
        });
      };
      
      playChord();
      const interval = setInterval(playChord, 4000);
      synthNodesRef.current = [{ stop: () => clearInterval(interval) }];
    } else if (activeType === 'green') {
      // Forest Soundscape: Wind rustling + bird chirps
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const windSource = ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;
      
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(400, ctx.currentTime);
      windFilter.Q.setValueAtTime(0.7, ctx.currentTime);
      
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.05, ctx.currentTime);
      
      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGainRef.current!);
      windSource.start();
      
      // Wind modulator LFO (slow frequency sweeps)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // 0.15 Hz sweep
      lfoGain.gain.setValueAtTime(200, ctx.currentTime); // sweep by 200 Hz
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();
      
      // Synthesized Birds Chirping (random intervals)
      const playBirdChirp = () => {
        if (ctx.state === 'closed') return;
        const count = 2 + Math.floor(Math.random() * 3); // 2 to 4 quick chirps
        let timeOffset = 0;
        
        for (let j = 0; j < count; j++) {
          const chirpOsc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          
          chirpOsc.type = 'sine';
          const baseFreq = 2000 + Math.random() * 800;
          chirpOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime + timeOffset);
          chirpOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + timeOffset + 0.12);
          
          chirpGain.gain.setValueAtTime(0.0, ctx.currentTime + timeOffset);
          chirpGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + timeOffset + 0.02);
          chirpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.15);
          
          chirpOsc.connect(chirpGain);
          chirpGain.connect(masterGainRef.current!);
          chirpOsc.start(ctx.currentTime + timeOffset);
          chirpOsc.stop(ctx.currentTime + timeOffset + 0.2);
          
          timeOffset += 0.18; // chirp spacing
        }
      };
      
      const birdInterval = setInterval(() => {
        if (Math.random() > 0.3) {
          playBirdChirp();
        }
      }, 3000);
      
      synthNodesRef.current = [
        windSource, windFilter, windGain, lfo, lfoGain,
        { stop: () => clearInterval(birdInterval) }
      ];
    } else if (activeType === 'water') {
      // Water Flow: Stream water rushing + random droplets splashing
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const waterSource = ctx.createBufferSource();
      waterSource.buffer = noiseBuffer;
      waterSource.loop = true;
      
      const waterFilter = ctx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.setValueAtTime(350, ctx.currentTime);
      
      const waterGain = ctx.createGain();
      waterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      
      waterSource.connect(waterFilter);
      waterFilter.connect(waterGain);
      waterGain.connect(masterGainRef.current!);
      waterSource.start();
      
      // Water filter frequency sweeps to simulate rushing waves
      const waveLfo = ctx.createOscillator();
      const waveLfoGain = ctx.createGain();
      waveLfo.frequency.setValueAtTime(0.25, ctx.currentTime); // 4-second cycle
      waveLfoGain.gain.setValueAtTime(100, ctx.currentTime); // +/- 100 Hz sweep
      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(waterFilter.frequency);
      waveLfo.start();
      
      // Splashing droplets
      const playSplash = () => {
        if (ctx.state === 'closed') return;
        const splashOsc = ctx.createOscillator();
        const splashGain = ctx.createGain();
        
        splashOsc.type = 'sine';
        const startFreq = 800 + Math.random() * 600;
        splashOsc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        splashOsc.frequency.exponentialRampToValueAtTime(startFreq * 2.5, ctx.currentTime + 0.08); // rising sweep
        
        splashGain.gain.setValueAtTime(0.015, ctx.currentTime);
        splashGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        
        splashOsc.connect(splashGain);
        splashGain.connect(masterGainRef.current!);
        
        splashOsc.start();
        splashOsc.stop(ctx.currentTime + 0.15);
      };
      
      const splashInterval = setInterval(playSplash, 400);
      
      synthNodesRef.current = [
        waterSource, waterFilter, waterGain, waveLfo, waveLfoGain,
        { stop: () => clearInterval(splashInterval) }
      ];
    }
    
    setAmbientPlaying(true);
  };

  const stopAmbientSynth = () => {
    if (synthNodesRef.current.length > 0) {
      synthNodesRef.current.forEach(node => {
        try {
          if (node.stop) node.stop();
          else if (node.disconnect) node.disconnect();
        } catch (e) {}
      });
      synthNodesRef.current = [];
    }
    setAmbientPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopAmbientSynth();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Gaze Particle VFX Effect
  useEffect(() => {
    if (!canvasRef.current || !isFocused || !isActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let particles: Array<{ x: number, y: number, vx: number, vy: number, size: number, alpha: number }> = [];
    
    const colors = {
      default: '#00ffa3',
      cyberpunk: '#ff007f',
      glacier: '#00d2ff',
      volcano: '#ff0000'
    };
    const activeColor = colors[selectedTheme as keyof typeof colors] || colors.default;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (particles.length < 30) {
        particles.push({
          x: canvas.width / 2 + (Math.random() * 40 - 20),
          y: canvas.height / 2 + (Math.random() * 40 - 20),
          vx: Math.random() * 1.5 - 0.75,
          vy: Math.random() * 1.5 - 0.75,
          size: Math.random() * 2 + 1,
          alpha: 1.0
        });
      }
      
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;
        
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = activeColor;
        ctx.shadowBlur = 6;
        ctx.shadowColor = activeColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        if (p.alpha <= 0) {
          particles.splice(idx, 1);
        }
      });
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isFocused, isActive, selectedTheme]);

  // Redirect to login if user not logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    if (!user) {
      checkUser();
    }
  }, [user, router]);

  // Resume ongoing study session if page is refreshed / restarted
  useEffect(() => {
    const checkAndResumeSession = async () => {
      if (!user || !roomId) return;
      try {
        const { data: activeSession } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('room_id', roomId)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeSession) {
          console.log("Resuming ongoing study session:", activeSession.id);
          const elapsed = Math.floor((new Date().getTime() - new Date(activeSession.start_time).getTime()) / 1000);
          
          // Penalty: deduct 45 seconds from focus_seconds and screen_focus_seconds as penalty
          const penalty = 45;
          const penalizedFocus = Math.max(0, activeSession.focus_seconds - penalty);
          const penalizedScreen = Math.max(0, activeSession.screen_focus_seconds - penalty);
          
          setSessionId(activeSession.id);
          setSeconds(elapsed);
          setFocusSeconds(penalizedFocus);
          setScreenFocusSeconds(penalizedScreen);
          setPaperFocusSeconds(activeSession.paper_focus_seconds);
          setModeChanges(activeSession.mode_changes || []);
          
          setSessionStarted(true);
          setIsActive(true);

          // Update the database with the penalized values immediately
          await supabase
            .from('study_sessions')
            .update({
              focus_seconds: penalizedFocus,
              screen_focus_seconds: penalizedScreen
            })
            .eq('id', activeSession.id);
        }
      } catch (err) {
        console.error("Failed to check and resume ongoing study session:", err);
      }
    };

    checkAndResumeSession();
  }, [user, roomId]);

  // Auto-start session for room duels
  useEffect(() => {
    if (user && roomId && !sessionStarted && lobbyDeployed) {
      const timer = setTimeout(() => {
        handleStartSession();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, roomId, sessionStarted, lobbyDeployed]);

  // Initialize MediaPipe Gaze Tracking
  const initWebRTC = async (localStream: MediaStream) => {
    if (!roomId || !user) return;
    console.log("WebRTC: Initializing P2P connection for room", roomId);
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      const iceCandidatesQueue: any[] = [];

      // Add local stream tracks to PC only if camera sharing is enabled
      if (shareCamera) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream tracks
      pc.ontrack = (event) => {
        console.log("WebRTC: Received remote stream track event!");
        if (opponentVideoRef.current && event.streams[0]) {
          opponentVideoRef.current.srcObject = event.streams[0];
          opponentVideoRef.current.play().catch(e => console.error("WebRTC play error:", e));
        }
        Object.values(opponentVideoRefs.current).forEach(videoEl => {
          if (videoEl && event.streams[0]) {
            videoEl.srcObject = event.streams[0];
            videoEl.play().catch(e => console.error("WebRTC play error on dynamic ref:", e));
          }
        });
      };

      // Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcChannelRef.current) {
          webrtcChannelRef.current.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { senderId: user.id, candidate: event.candidate }
          });
        }
      };

      // Setup Realtime signaling channel
      const channel = supabase.channel(`webrtc-${roomId}`);
      webrtcChannelRef.current = channel;

      channel
        .on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
          const { senderId, sdp, candidate } = payload;
          if (senderId === user.id) return; // Ignore own signals

          if (sdp) {
            console.log("WebRTC: Received SDP signal:", sdp.type);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            
            // Flush queued ice candidates
            while (iceCandidatesQueue.length > 0) {
              const cand = iceCandidatesQueue.shift();
              if (cand) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.error("WebRTC error flushing candidate:", e);
                }
              }
            }

            if (sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc-signal',
                payload: { senderId: user.id, sdp: answer }
              });
            }
          } else if (candidate) {
            console.log("WebRTC: Received ICE candidate");
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error("WebRTC error adding ICE candidate:", e);
              }
            } else {
              iceCandidatesQueue.push(candidate);
            }
          }
        })
        .on('broadcast', { event: 'opponent-forfeit' }, ({ payload }) => {
          const { forfeiterId } = payload;
          if (forfeiterId === user.id) return;
          console.log("WebRTC: Opponent forfeited the match!");
          
          if (playersCount <= 2) {
            // 1v1 Duel: End the match immediately
            setOpponentHandsDown(true);
            handleEndSession('opponent');
          } else {
            // Multi-player match: Alert remaining players
            const forfeitedOpp = opponents.find(o => o.userId === forfeiterId);
            const oppName = forfeitedOpp ? forfeitedOpp.name : 'A contestant';
            setForfeitAlerts(prev => [...prev, `${oppName} forfeited ("Hands Down")`]);
            setTimeout(() => {
              setForfeitAlerts(prev => prev.slice(1));
            }, 4000);
            
            // Play slide alarm sound
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              }
            } catch (e) {}
          }
        })
        .on('broadcast', { event: 'peer-joined' }, async ({ payload }) => {
          const { senderId } = payload;
          if (senderId === user.id) return;
          console.log("WebRTC: Peer joined signaling channel:", senderId);
          
          // The peer with the lexicographically smaller ID acts as the WebRTC initiator!
          const isInitiator = user.id.localeCompare(senderId) < 0;
          if (isInitiator) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc-signal',
                payload: { senderId: user.id, sdp: offer }
              });
              console.log("WebRTC: SDP Offer sent to new peer by initiator:", user.id);
            } catch (err) {
              console.error("WebRTC error creating offer on peer join:", err);
            }
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log("WebRTC: Subscribed to signaling.");
            
            // Broadcast peer-joined to announce our presence so the initiator knows to send offer
            setTimeout(() => {
              channel.send({
                type: 'broadcast',
                event: 'peer-joined',
                payload: { senderId: user.id }
              });
            }, 1000);

            // Wait 4 seconds to let both sides stabilize, then check if we should create offer (fallback)
            setTimeout(async () => {
              const { data: presenceList } = await supabase
                .from('room_presence')
                .select('user_id')
                .eq('room_id', roomId)
                .order('user_id', { ascending: true });

              if (presenceList && presenceList.length > 0) {
                const initiatorId = presenceList[0].user_id;
                if (user.id === initiatorId) {
                  try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    channel.send({
                      type: 'broadcast',
                      event: 'webrtc-signal',
                      payload: { senderId: user.id, sdp: offer }
                    });
                    console.log("WebRTC: SDP Offer sent by fallback initiator:", user.id);
                  } catch (err) {
                    console.error("WebRTC error creating offer in fallback:", err);
                  }
                }
              }
            }, 4000);
          }
        });

    } catch (err) {
      console.error("Failed to initialize WebRTC:", err);
    }
  };

  const initializeFaceMesh = () => {
    const FaceMesh = (window as any).FaceMesh;
    if (!FaceMesh || !videoRef.current) {
      console.warn("MediaPipe variables or camera element not ready.");
      return;
    }

    const faceMesh = new FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results: any) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Iris center point tracking
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        const noseTip = landmarks[4];

        if (leftIris && rightIris && noseTip) {
          const hGaze = (leftIris.x + rightIris.x) / 2 - noseTip.x;
          const vGaze = (leftIris.y + rightIris.y) / 2 - noseTip.y;

          let dir = 'Center';

          const leftBound = calibThresholds.left * gazeSensitivity;
          const rightBound = calibThresholds.right * gazeSensitivity;
          const downBound = calibThresholds.down * (2 - gazeSensitivity);

          if (hGaze < leftBound) {
            dir = 'Left';
          } else if (hGaze > rightBound) {
            dir = 'Right';
          } else if (vGaze > downBound) {
            dir = 'Down';
          }

          setGazeDirection(dir);

          // Combined: Center (screen) or Down (paper/book) are both focused
          if (dir === 'Center' || dir === 'Down') {
            setIsFocused(true);
            setFocusScore(prev => Math.min(100, parseFloat((prev + (2.0 * recoveryMultiplier)).toFixed(2))));
          } else {
            setIsFocused(prev => {
              if (prev) {
                setInterruptions(i => i + 1);
              }
              return false;
            });
            setFocusScore(prev => Math.max(0, prev - (8 * decayMultiplier))); // Scaled lookaway penalty
          }
        }
      } else {
        setGazeDirection('Face Undetected');
        setIsFocused(prev => {
          if (prev) {
            setInterruptions(i => i + 1);
          }
          return false;
        });
        setFocusScore(prev => Math.max(0, prev - 10)); // Major penalty
      }
    });

    // Request camera using getUserMedia
    navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 },
      audio: false
    }).then((stream) => {
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Webcam local play error:", e));
      }

      // Initialize P2P connection to share stream
      if (roomId) {
        initWebRTC(stream);
      }

      let active = true;
      const processFrame = async () => {
        if (!active) return;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await faceMesh.send({ image: videoRef.current });
          } catch (e) {
            console.error("FaceMesh frame processing error:", e);
          }
        }
        requestAnimationFrame(processFrame);
      };
      requestAnimationFrame(processFrame);

      cameraInstRef.current = {
        stop: () => {
          active = false;
          stream.getTracks().forEach(t => t.stop());
        }
      };
      faceMeshRef.current = faceMesh;
      setCameraActive(true);
    }).catch(err => {
      console.error("Camera access failed:", err);
      alert("Camera access denied or device is busy. Check browser permissions.");
    });
  };

  const handleStartSession = async () => {
    setIsActive(true);
    setSessionStarted(true);
    
    // Set initial mode change log
    const initialLog: ModeLog = { timestamp: new Date().toISOString(), mode: 'screen' };
    setModeChanges([initialLog]);

    if (user) {
      try {
        // Ensure user profile exists in public.users to prevent foreign key check failures!
        const { data: profileCheck } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileCheck) {
          // Auto-recover profile row
          await supabase.from('users').insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Contestant',
            email: user.email || '',
            daily_goal_minutes: 120
          });
        }

        // Ensure wallet exists
        const { data: walletCheck } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!walletCheck) {
          await supabase.from('wallets').insert({
            user_id: user.id,
            balance: 1000
          });
        }

        console.log("Attempting to insert study session for user:", user.id);
        const { data, error } = await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            room_id: roomId || null,
            start_time: new Date().toISOString(),
            focus_seconds: 0,
            total_seconds: 0,
            mode_changes: [initialLog],
            screen_focus_seconds: 0,
            paper_focus_seconds: 0,
          })
          .select()
          .single();

        if (!error && data) {
          console.log("Successfully created study session row with ID:", data.id);
          setSessionId(data.id);
        } else if (error) {
          console.error("Failed to create study session row. Complete error details:", error);
        }
      } catch (e) {
        console.error("Error creating study session:", e);
      }
    }

    // Camera auto-initialization will be handled by useEffect after DOM mount
  };

  const handleTogglePause = () => {
    setIsActive(!isActive);
  };

  const get50Stats = (p1: any, p2: any) => {
    const statsList = [
      { name: "Total Focus Duration", p1: p1.focusSeconds, p2: p2.focusSeconds, higherIsBetter: true },
      { name: "Average Attention Ratio", p1: p1.attentionRatio, p2: p2.attentionRatio, higherIsBetter: true },
      { name: "Peak Focus Streak", p1: p1.longestStreak, p2: p2.longestStreak, higherIsBetter: true },
      { name: "Lookaway Interruptions", p1: p1.interruptions, p2: p2.interruptions, higherIsBetter: false },
      { name: "Rig Stability Index", p1: Math.max(0, 100 - p1.interruptions * 5), p2: Math.max(0, 100 - p2.interruptions * 5), higherIsBetter: true },
      { name: "Flow State Density", p1: p1.focusSeconds > 0 ? Math.round((p1.focusSeconds / p1.totalSeconds) * 100) : 0, p2: p2.focusSeconds > 0 ? Math.round((p2.focusSeconds / p2.totalSeconds) * 100) : 0, higherIsBetter: true },
      { name: "Lookaway Penalty Recovery Rate", p1: Math.round(p1.recoveryMultiplier * 10), p2: Math.round(p2.recoveryMultiplier * 10), higherIsBetter: true },
      { name: "Cognitive Jitter Tolerance", p1: Math.round(100 / (p1.decayMultiplier || 1)), p2: Math.round(100 / (p2.decayMultiplier || 1)), higherIsBetter: true },
      { name: "Screen Focus Duration", p1: p1.screenSeconds, p2: p2.screenSeconds, higherIsBetter: true },
      { name: "Paper Focus Duration", p1: p1.paperSeconds, p2: p2.paperSeconds, higherIsBetter: true },
    ];

    const statNames = [
      "Neural Latency Quotient", "Gaze Path Stability", "Attention Velocity", "Focus Coherence Factor",
      "Decay Resistance Margin", "Blink Frequency Score", "Flow Jitter Suppression", "Iris Drift Jitter",
      "Cognitive Lock Strength", "Sprint Engagement Coefficient", "Mental Endurance Yield", "Telemetry Precision Jitter",
      "Rig Calibration Match", "Gaze Vector Alignment", "Optimal Gaze Threshold", "Decay Penalty Dampening",
      "Alpha Wave Synchrony", "Deep State Immersion Index", "Focus Sprint Acceleration", "Attention Retention Depth",
      "Visual Anchor Stability", "Distraction Immunity Ratio", "Cognitive Sweep Rate", "Task Progress Yield",
      "Streak Acceleration Constant", "Engagement Jitter Shield", "Focus Horizon Index", "Sustained Attention Density",
      "Morning Study Affinity", "Rig Power Efficiency Score", "Telemetry Jitter Filtration", "Synaptic Load Balance",
      "Flow State Recovery Constant", "Focus Anchor Efficiency", "Iris Tracking Precision", "Drift Correction Velocity",
      "Attention Recovery Jitter", "Cognitive Drift Threshold", "Workspace Luminance Jitter", "Neural Endurance Constant"
    ];

    statNames.forEach((sName, idx) => {
      const hash1 = (p1.focusSeconds * (idx + 1) + p1.longestStreak * 7 + p1.attentionRatio * 3) % 100;
      let hash2 = (p2.focusSeconds * (idx + 1) + p2.longestStreak * 7 + p2.attentionRatio * 3 + idx * 5 + 17) % 100;
      if (hash1 === hash2) {
        hash2 = (hash2 + 1) % 100;
      }
      statsList.push({
        name: sName,
        p1: hash1,
        p2: hash2,
        higherIsBetter: idx % 2 === 0
      });
    });

    return statsList;
  };

  const handleEndSession = async (forfeitUser?: 'self' | 'opponent') => {
    setIsActive(false);
    setSessionStarted(false);
    if (cameraInstRef.current) {
      cameraInstRef.current.stop();
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (webrtcChannelRef.current) {
      supabase.removeChannel(webrtcChannelRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    let isWinner = false;
    let forfeitFlag = false;
    let oppName = '';
    let oppFocusSecs = 0;

    if (roomId && sessionId && user) {
      const opp = opponents[0];
      if (opp) {
        oppName = opp.name;
        oppFocusSecs = opp.focusSeconds;
      }

      if (forfeitUser === 'self') {
        isWinner = false;
        forfeitFlag = true;
        setBattleReason('You forfeited the duel via Hands Down.');
        setBattleWinnerName(opp ? opp.name : 'Opponent');
      } else if (forfeitUser === 'opponent') {
        isWinner = true;
        setBattleReason('Your opponent forfeited the duel via Hands Down.');
        setBattleWinnerName(profile?.name || 'You');
      } else {
        const p1Data = {
          focusSeconds,
          longestStreak,
          interruptions,
          recoveryMultiplier,
          decayMultiplier,
          screenSeconds: screenFocusSeconds,
          paperSeconds: paperFocusSeconds,
          totalSeconds: seconds,
          attentionRatio: seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 100
        };

        const p2Data = {
          focusSeconds: opp ? opp.focusSeconds : 0,
          longestStreak: opp ? opp.current_streak || 0 : 0,
          interruptions: opp ? opp.interruptions_count || 0 : 0,
          recoveryMultiplier: 1.0,
          decayMultiplier: 1.0,
          screenSeconds: opp ? Math.round(opp.focusSeconds * 0.7) : 0,
          paperSeconds: opp ? Math.round(opp.focusSeconds * 0.3) : 0,
          totalSeconds: seconds,
          attentionRatio: opp ? opp.attention_ratio || 0 : 0
        };

        const statsGenerated = get50Stats(p1Data, p2Data);
        setBattleStatsResults(statsGenerated);

        let p1Wins = 0;
        let p2Wins = 0;
        statsGenerated.forEach(s => {
          const p1Val = s.p1;
          const p2Val = s.p2;
          const higherIsBetter = s.higherIsBetter;
          if (higherIsBetter) {
            if (p1Val > p2Val) p1Wins++;
            else p2Wins++;
          } else {
            if (p1Val < p2Val) p1Wins++;
            else p2Wins++;
          }
        });

        setP1WinsCount(p1Wins);
        setP2WinsCount(p2Wins);

        if (p1Wins > p2Wins) {
          isWinner = true;
          setBattleWinnerName(profile?.name || 'You');
          setBattleReason(`You outperformed your opponent in ${p1Wins} of 50 cyberpunk stats.`);
        } else if (p2Wins > p1Wins) {
          isWinner = false;
          setBattleWinnerName(opp ? opp.name : 'Opponent');
          setBattleReason(`Opponent outperformed you in ${p2Wins} of 50 cyberpunk stats.`);
        } else {
          if (focusSeconds >= p2Data.focusSeconds) {
            isWinner = true;
            setBattleWinnerName(profile?.name || 'You');
            setBattleReason('Tiebreaker: You logged higher focus seconds.');
          } else {
            isWinner = false;
            setBattleWinnerName(opp ? opp.name : 'Opponent');
            setBattleReason('Tiebreaker: Opponent logged higher focus seconds.');
          }
        }
      }

      setShowResultsOverlay(true);
    }

    if (sessionId && user) {
      console.log("Saving end session stats for sessionId:", sessionId);
      try {
        const { error: updateError } = await supabase
          .from('study_sessions')
          .update({
            end_time: new Date().toISOString(),
            focus_seconds: focusSeconds,
            total_seconds: seconds,
            mode_changes: modeChanges,
            screen_focus_seconds: screenFocusSeconds,
            paper_focus_seconds: paperFocusSeconds,
            is_winner: roomId ? isWinner : null,
            opponent_name: oppName || null,
            opponent_focus_seconds: roomId ? oppFocusSecs : null,
            hands_down_forfeited: forfeitFlag
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error("Failed to update study session row in DB:", updateError);
        } else {
          console.log("Successfully updated study session row in DB");
        }

        // Award XP / Points for Solo Session: 5 points per focus minute
        if (!roomId && focusSeconds > 0) {
          const soloMinutesFocused = Math.max(1, Math.floor(focusSeconds / 60));
          const ptsGained = soloMinutesFocused * 5;

          const { data: userData } = await supabase
            .from('users')
            .select('points')
            .eq('id', user.id)
            .single();

          if (userData) {
            const currentPoints = userData.points || 0;
            const newPoints = currentPoints + ptsGained;

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
          }
        }

        const rewardMultiplier = user?.user_metadata?.is_pro === true ? 2 : 1;
        const tokenBase = Math.round(focusSeconds / 120);
        const winBonus = (roomId && isWinner) ? 100 : 0;
        const rewardTokens = (tokenBase + winBonus) * rewardMultiplier;
        
        if (rewardTokens > 0) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

          if (walletData) {
            await supabase
              .from('wallets')
              .update({ balance: walletData.balance + rewardTokens })
              .eq('user_id', user.id);

            await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'winning',
              amount: rewardTokens,
              description: `Focus Battle Reward${rewardMultiplier > 1 ? ' (2x PRO Multiplier)' : ''}: ${isWinner ? 'WINNER BONUS +100 tokens, ' : ''}screen ${screenFocusSeconds}s, paper ${paperFocusSeconds}s`
            });
          }
        }

        if (roomId) {
          await supabase.from('room_presence').delete().eq('room_id', roomId).eq('user_id', user.id);
        }

        await refreshWallet();
        await refreshProfile();

        if (roomId) {
          if (isWinner) {
            playVictorySound();
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
          } else {
            playDefeatSound();
          }
        } else {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }

      } catch (e) {
        console.error("Failed to save end session stats:", e);
      }
    }

    if (!roomId) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  const syncSessionProgress = async () => {
    if (!sessionId || !user) return;
    try {
      await supabase
        .from('study_sessions')
        .update({
          focus_seconds: focusSecondsRef.current,
          total_seconds: secondsRef.current,
          mode_changes: modeChangesRef.current,
          screen_focus_seconds: screenFocusSecondsRef.current,
          paper_focus_seconds: paperFocusSecondsRef.current
        })
        .eq('id', sessionId);
    } catch (e) {
      console.error(e);
    }
  };

  // Keep ref mirrors in sync with state so the interval closure is always fresh
  useEffect(() => { isFocusedRef.current = isFocused; }, [isFocused]);
  useEffect(() => { focusScoreRef.current = focusScore; }, [focusScore]);
  useEffect(() => { gazeDirectionRef.current = gazeDirection; }, [gazeDirection]);
  useEffect(() => { currentStreakRef.current = currentStreak; }, [currentStreak]);
  useEffect(() => { longestStreakRef.current = longestStreak; }, [longestStreak]);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);
  useEffect(() => { focusSecondsRef.current = focusSeconds; }, [focusSeconds]);
  useEffect(() => { screenFocusSecondsRef.current = screenFocusSeconds; }, [screenFocusSeconds]);
  useEffect(() => { paperFocusSecondsRef.current = paperFocusSeconds; }, [paperFocusSeconds]);
  useEffect(() => { modeChangesRef.current = modeChanges; }, [modeChanges]);

  // Timer Tick Loop — depends only on isActive so it never restarts mid-session
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const nextSec = prev + 1;
          if (nextSec % 10 === 0) {
            const minStr = `${Math.floor(nextSec / 60)}:${(nextSec % 60).toString().padStart(2, '0')}`;
            setChartData(c => [...c, { time: minStr, level: isFocusedRef.current ? focusScoreRef.current : 0 }]);
            setStreakChartData(s => [...s, { time: minStr, streak: isFocusedRef.current ? currentStreakRef.current : 0 }]);
          }
          return nextSec;
        });

        if (isFocusedRef.current && (focusScoreRef.current >= 75 || !cameraActive)) {
          setFocusSeconds(prev => prev + 1);
          if (!cameraActive || gazeDirectionRef.current === 'Center') {
            setScreenFocusSeconds(prev => prev + 1);
          } else if (gazeDirectionRef.current === 'Down') {
            setPaperFocusSeconds(prev => prev + 1);
          }
          setCurrentStreak(prev => {
            const next = prev + 1;
            if (next > longestStreakRef.current) setLongestStreak(next);
            return next;
          });
        } else {
          setCurrentStreak(0);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, cameraActive]);

  // Debounced DB Sync Loop
  useEffect(() => {
    if (isActive) {
      syncIntervalRef.current = setInterval(() => {
        syncSessionProgress();
      }, 10000);
    } else {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    }

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isActive]);

  // Setup room presence syncing if in a room
  useEffect(() => {
    if (!roomId || !user || !sessionStarted || !isActive) return;
    
    const upsertPresence = async () => {
      try {
        await supabase.from('room_presence').upsert({
          room_id: roomId,
          user_id: user.id,
          focus_score: focusScoreRef.current,
          focus_seconds: focusSeconds,
          share_camera: shareCamera,
          share_graphs: shareGraphs,
          share_stats: shareStats,
          is_active: isActive,
          hands_down: selfHandsDown,
          attention_ratio: seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 100,
          interruptions_count: interruptions,
          current_streak: currentStreak,
          updated_at: new Date().toISOString()
        }, { onConflict: 'room_id,user_id' });
      } catch (err) {
        console.error("Error upserting presence:", err);
      }
    };

    upsertPresence();

    const interval = setInterval(async () => {
      await upsertPresence();
      
      const { data, error } = await supabase
        .from('room_presence')
        .select('*, users(name, avatar_url)')
        .eq('room_id', roomId)
        .neq('user_id', user.id);

      if (error) {
        console.error("Room presence select query error:", error.message);
      }

      if (!error && data) {
        // If any opponent has hands_down = true, trigger opponent forfeit loss
        const forfeiter = data.find(opt => opt.hands_down);
        if (forfeiter) {
          if (playersCount <= 2) {
            setOpponentHandsDown(true);
          } else {
            // Multi-player match: Alert remaining players
            const oppName = forfeiter.users?.name || 'A contestant';
            setForfeitAlerts(prev => {
              const alertMsg = `${oppName} forfeited ("Hands Down")`;
              if (prev.includes(alertMsg)) return prev;
              
              setTimeout(() => {
                setForfeitAlerts(p => p.filter(x => x !== alertMsg));
              }, 4000);
              return [...prev, alertMsg];
            });
            
            // Play slide alarm sound
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              }
            } catch (e) {}
          }
        }

        setOpponents(prev => {
          return data.map(opt => {
            const existingOpt = prev.find(p => p.userId === opt.user_id);
            const updatedChart = existingOpt ? [...existingOpt.chartData] : [];
            const timeStr = `${Math.floor(opt.focus_seconds / 60)}:${(opt.focus_seconds % 60).toString().padStart(2, '0')}`;
            
            if (opt.is_active) {
              if (updatedChart.length === 0 || updatedChart[updatedChart.length - 1].time !== timeStr) {
                updatedChart.push({ time: timeStr, level: opt.focus_score });
                if (updatedChart.length > 15) {
                  updatedChart.shift();
                }
              }
            }
            
            return {
              userId: opt.user_id,
              name: opt.users?.name || 'Arena Fighter',
              avatarUrl: opt.users?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150',
              focusScore: opt.focus_score,
              focusSeconds: opt.focus_seconds,
              isMuted: opt.is_muted,
              shareCamera: opt.share_camera,
              shareGraphs: opt.share_graphs,
              shareStats: opt.share_stats,
              isActive: opt.is_active,
              hands_down: opt.hands_down,
              attention_ratio: opt.attention_ratio,
              interruptions_count: opt.interruptions_count,
              current_streak: opt.current_streak,
              chartData: updatedChart
            };
          });
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, user, sessionStarted, isActive, focusSeconds, shareCamera, shareGraphs, shareStats, selfHandsDown, seconds, interruptions, currentStreak]);

  // Clean up room presence on unmount
  useEffect(() => {
    return () => {
      if (roomId && user) {
        supabase.from('room_presence').delete().eq('room_id', roomId).eq('user_id', user.id).then();
      }
    };
  }, [roomId, user]);

  // Forfeit Listener Effect
  useEffect(() => {
    if (opponentHandsDown && isActive) {
      handleEndSession('opponent');
    }
  }, [opponentHandsDown, isActive]);

  // WebRTC unmount cleanup
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (webrtcChannelRef.current) {
        supabase.removeChannel(webrtcChannelRef.current);
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Auto-initialize camera once session starts and split viewport layout mounts
  useEffect(() => {
    let active = true;
    const checkAndInit = () => {
      if (!active) return;
      const FaceMesh = (window as any).FaceMesh;
      if (sessionStarted && lobbyDeployed && !cameraActive) {
        if (videoRef.current && FaceMesh) {
          initializeFaceMesh();
        } else {
          // Retry in 500ms
          setTimeout(checkAndInit, 500);
        }
      }
    };

    if (sessionStarted && lobbyDeployed && !cameraActive) {
      checkAndInit();
    }

    return () => {
      active = false;
    };
  }, [sessionStarted, lobbyDeployed, cameraActive]);

  // Load study theme configuration on page mount (independent of global theme)
  useEffect(() => {
    const saved = localStorage.getItem('cognisweep-study-theme');
    if (saved && ['dark', 'pink', 'green', 'water'].includes(saved)) {
      setSelectedTheme(saved);
      setSelectedAmbient(saved);
    }
  }, []);

  const handleThemeSelect = (tId: string) => {
    setSelectedTheme(tId);
    setSelectedAmbient(tId);
    localStorage.setItem('cognisweep-study-theme', tId);
    if (ambientPlaying) {
      startAmbientSynth(tId);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  // Calibration trigger
  const runCalibration = (step: number) => {
    if (step === 1) {
      setCalibrationStep(1);
    } else if (step === 2) {
      setCalibrationStep(2);
    } else if (step === 3) {
      setCalibrationStep(3);
    } else {
      setCalibrationStep(0);
      setCalibrated(true);
      setGazeDirection('Calibrated');
    }
  };

  const themeColors: Record<string, { b1: string, b2: string, b3: string, primary: string, text: string, glow: string }> = {
    pink: { b1: 'rgba(255, 182, 193, 0.12)', b2: 'rgba(255, 105, 180, 0.12)', b3: 'rgba(219, 112, 147, 0.1)', primary: '#FF69B4', text: '#FFC0CB', glow: 'rgba(255, 105, 180, 0.4)' },
    dark: { b1: 'rgba(0, 255, 163, 0.08)', b2: 'rgba(0, 194, 255, 0.06)', b3: 'rgba(158, 0, 255, 0.06)', primary: '#00ffa3', text: '#94A3B8', glow: 'rgba(0, 255, 163, 0.3)' },
    green: { b1: 'rgba(34, 197, 94, 0.15)', b2: 'rgba(22, 101, 52, 0.12)', b3: 'rgba(20, 83, 45, 0.1)', primary: '#22C55E', text: '#86EFAC', glow: 'rgba(34, 197, 94, 0.4)' },
    water: { b1: 'rgba(6, 182, 212, 0.15)', b2: 'rgba(14, 116, 144, 0.12)', b3: 'rgba(8, 145, 178, 0.1)', primary: '#06B6D4', text: '#67E8F9', glow: 'rgba(6, 182, 212, 0.4)' }
  };

  const activeColors = themeColors[selectedTheme] || themeColors.dark;

  const motivationQuotes = [
    "Deep focus is a superpower.",
    "Every second of concentration shapes your future.",
    "Silence the noise. Master the grind.",
    "Consistency beats raw talent.",
    "You are in control of your attention.",
    "One task at a time. Pure dedication.",
    "Your brain is a muscle. Train it to focus."
  ];
  const currentQuote = motivationQuotes[Math.floor(seconds / 15) % motivationQuotes.length];
  const isPro = true;

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className={`theme-${selectedTheme} bg-background text-on-background h-screen flex flex-col relative font-sans overflow-hidden`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes petal-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% {
            transform: translateY(110vh) rotate(720deg) translateX(120px);
            opacity: 0;
          }
        }
        .animate-petal { animation: petal-fall linear infinite; }

        @keyframes leaf-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg) translateX(0) scale(1);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-40px) scale(1.1);
          }
          100% {
            transform: translateY(110vh) rotate(360deg) translateX(80px) scale(0.9);
            opacity: 0;
          }
        }
        .animate-leaf { animation: leaf-fall linear infinite; }

        @keyframes water-bubble {
          0% {
            transform: translateY(110vh) scale(0.8);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(-10vh) scale(1.2) translateX(30px);
            opacity: 0;
          }
        }
        .animate-bubble { animation: water-bubble linear infinite; }

        @keyframes wind-sway {
          0% { transform: scale(1.03) translate(0px, 0px) rotate(0deg) skewX(0deg); }
          50% { transform: scale(1.06) translate(6px, 3px) rotate(0.4deg) skewX(0.8deg); }
          100% { transform: scale(1.03) translate(0px, 0px) rotate(0deg) skewX(0deg); }
        }
        .animate-wind-sway { animation: wind-sway 4s ease-in-out infinite; }

        @keyframes pink-morph {
          0% { transform: scale(1.02) rotate(0deg); }
          50% { transform: scale(1.05) rotate(1.2deg); }
          100% { transform: scale(1.02) rotate(0deg); }
        }
        .animate-pink-morph { animation: pink-morph 5s ease-in-out infinite; }

        @keyframes water-ripple-flow {
          0% { transform: scale(1.04) translateY(0px); filter: brightness(0.95); }
          50% { transform: scale(1.07) translateY(-6px); filter: brightness(1.05); }
          100% { transform: scale(1.04) translateY(0px); filter: brightness(0.95); }
        }
        .animate-water-ripple-flow { animation: water-ripple-flow 4.5s ease-in-out infinite; }
        
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}} />

      <AnimatedBackground theme={selectedTheme} activeColors={activeColors} />

      {/* Calibration Overlay */}
      <AnimatePresence>
        {!calibrated && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-xl text-center space-y-6">
              <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">Gaze Calibration Portal</h2>
              
              <div className="relative aspect-video w-full bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex items-center justify-center">
                {calibrationStep === 0 && (
                  <div className="space-y-4 max-w-sm">
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      Calibrate eye mesh zone triggers. Look directly at the targets as they appear and click them.
                    </p>
                    <button 
                      onClick={() => runCalibration(1)}
                      className="bg-primary-container text-on-primary font-label-mono text-xs font-bold px-6 py-2.5 rounded-lg shadow-[0_0_15px_rgba(0,255,163,0.3)] cursor-pointer"
                    >
                      Begin Calibration
                    </button>
                  </div>
                )}

                {calibrationStep === 1 && (
                  <button 
                    onClick={() => runCalibration(2)}
                    className="absolute top-4 left-4 w-6 h-6 rounded-full bg-primary-container border-2 border-white animate-pulse cursor-pointer"
                  />
                )}

                {calibrationStep === 2 && (
                  <button 
                    onClick={() => runCalibration(3)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary-container border-2 border-white animate-pulse cursor-pointer"
                  />
                )}

                {calibrationStep === 3 && (
                  <button 
                    onClick={() => runCalibration(4)}
                    className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-error border-2 border-white animate-pulse cursor-pointer"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!lobbyDeployed ? (
        <div className="flex-grow flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md bg-surface-container/90 backdrop-blur-md border border-outline-variant rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center">
            {/* Glow decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="font-display text-2xl font-black text-on-surface uppercase tracking-tight mb-4">
              RIG SETUP LOBBY
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-6">
              Configure parameters before deploying to the Arena
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3.5 bg-background border border-outline-variant/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed text-lg">videocam</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-on-surface">Share Webcam Feed</p>
                    <p className="text-[9px] text-on-surface-variant leading-tight">Stream camera to other participants</p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={shareCamera}
                  onChange={(e) => setShareCamera(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-background border border-outline-variant/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed text-lg">show_chart</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-on-surface">Share Focus Graphs</p>
                    <p className="text-[9px] text-on-surface-variant leading-tight">Display gaze charts in real time</p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={shareGraphs}
                  onChange={(e) => setShareGraphs(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-background border border-outline-variant/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed text-lg">timer</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-on-surface">Share Focus Stats</p>
                    <p className="text-[9px] text-on-surface-variant leading-tight">Publish focus ratio & streak totals</p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={shareStats}
                  onChange={(e) => setShareStats(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
              </div>
            </div>

            {(!shareCamera && !shareGraphs && !shareStats) ? (
              <div className="mb-6 p-3 bg-error/10 border border-error/30 rounded-xl text-left flex gap-2">
                <span className="material-symbols-outlined text-error text-sm shrink-0">error</span>
                <p className="text-[9px] text-error font-mono leading-normal">
                  CRITICAL PROTOCOL VIOLATION: At least one parameter must be shared to enter the Arena.
                </p>
              </div>
            ) : null}

            <button
              disabled={!shareCamera && !shareGraphs && !shareStats}
              onClick={() => {
                playTriumphFanfare();
                setLobbyDeployed(true);
                handleStartSession();
              }}
              className="w-full bg-primary-container disabled:opacity-50 hover:bg-primary-fixed text-on-primary disabled:hover:bg-primary-container font-label-mono text-xs font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] glow-primary flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Deploy Rig to Arena
            </button>
          </div>
        </div>
      ) : roomId ? (
        // Split view battle arena
        <main className="flex-grow flex flex-col justify-between w-full h-[calc(100vh-80px)] relative overflow-hidden bg-black select-none z-10">
          
          {/* Immersive Top Header Bar */}
          <div className="w-full flex justify-between items-center py-3 px-6 bg-gradient-to-b from-black/80 to-transparent relative z-30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed text-sm">military_tech</span>
              <span className="font-mono text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">COGNISWEEP ARENA DEPLOYMENT</span>
            </div>
            
            <div className="text-center">
              <span className="font-display text-base md:text-lg font-black text-white italic uppercase tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {sessionName || 'Deep Focus Arena'}
              </span>
              <div className="flex justify-center items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container live-pulse"></span>
                <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-widest font-bold">
                  FOCUS TIMELINE: {formatTimer(seconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[9px] text-on-surface-variant">
              <span className="font-bold">ROOM CODE:</span>
              <span className="font-black text-primary-fixed tracking-widest uppercase">{roomId ? String(roomId).substring(0, 8) : 'SOLO'}</span>
            </div>
          </div>

          {/* Full Screen Middle Split Viewport */}
          <div className="flex-grow flex flex-col md:flex-row w-full h-full relative overflow-hidden min-h-0">
            
            {/* User A: Current User (Left viewport - full screen cover) */}
            <div className="flex-1 h-1/2 md:h-full relative overflow-hidden group/usera bg-slate-950">
              <div className="w-full h-full relative bg-surface-container-low flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1] absolute inset-0 z-0"
                />
                {(!shareCamera || !cameraActive) && (
                  // Fallback: Pulsing Profile
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black to-slate-900 absolute inset-0 z-10">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#00ffa3] bg-surface-container relative shrink-0 shadow-[0_0_30px_rgba(0,255,163,0.4)] animate-pulse">
                      <img alt={profile?.name || 'You'} src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-display text-xl font-black text-white italic uppercase tracking-wider">{profile?.name}</span>
                    <span className="font-mono text-[9px] text-[#00ffa3] uppercase font-bold tracking-widest">
                      {!shareCamera ? 'WEBCAM SHARING DISABLED' : 'INITIALIZING CAMERA...'}
                    </span>
                    <div className="mt-4 max-w-xs text-center px-4">
                      <p className="font-mono text-[10px] text-primary-fixed/80 bg-primary-container/5 border border-primary-container/20 rounded-lg p-2.5 uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(0,255,163,0.05)]">
                        ⚡ {motivationQuotes[Math.floor(seconds / 15) % motivationQuotes.length]}
                      </p>
                    </div>
                  </div>
                )}

                {isFocused && isActive && shareCamera && (
                  <canvas 
                    ref={canvasRef}
                    width={320}
                    height={220}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />
                )}
              </div>

              {/* Bounding trackers corner overlay */}
              {cameraActive && isActive && shareCamera && (
                <div className={`absolute inset-10 border rounded transition-all duration-300 pointer-events-none z-10 ${
                  isFocused ? 'border-primary-container/20' : 'border-error/30'
                }`}>
                  <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                  <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                  <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                </div>
              )}

              {/* Player 1 Detail Badge */}
              <div className="absolute bottom-24 left-6 z-20 bg-black/60 border border-outline-variant/30 px-4 py-2 rounded-xl backdrop-blur font-mono text-[9px] text-on-surface uppercase tracking-wider">
                <span className="text-on-surface-variant font-bold">Player 1:</span> <span className="font-black text-primary-fixed">{profile?.name} (You)</span>
                {cameraActive && (
                  <div className="mt-1 flex items-center gap-1 font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-primary-container' : 'bg-error'}`}></span>
                    <span>{isFocused ? 'Focused' : 'Distracted'}</span>
                  </div>
                )}
              </div>

              {/* Hover Stats/Graphs Overlay for User A */}
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md opacity-0 invisible group-hover/usera:opacity-100 group-hover/usera:visible transition-all duration-300 flex flex-col p-6 z-30">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30 font-mono">
                  <span className="font-black text-xs text-primary-fixed uppercase tracking-wider">Player statistics</span>
                  <span className="text-[10px] text-on-surface-variant font-bold text-right">LIVE FOCUS HARVEST</span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-left font-mono text-[10px] mb-4">
                  <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Attention Ratio</span>
                    <span className="font-display text-base font-black text-primary-fixed">
                      {seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Focus Time</span>
                    <span className="font-display text-base font-black text-primary-fixed">
                      {Math.floor(focusSeconds / 60)}m {focusSeconds % 60}s
                    </span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Streak</span>
                    <span className="font-display text-base font-black text-secondary-fixed">
                      {currentStreak}s
                    </span>
                  </div>
                  <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                    <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Interruptions</span>
                    <span className="font-display text-base font-black text-error">
                      {interruptions}
                    </span>
                  </div>
                </div>

                {/* Graph */}
                <div className="flex-1 min-h-0 bg-background/50 border border-outline-variant/30 rounded-xl p-3 flex flex-col">
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider mb-2 block text-left">Gaze Focus Timeline</span>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                        <XAxis dataKey="time" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="#849588" fontSize={8} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '8px' }} />
                        <Line type="monotone" dataKey="level" stroke="#00FFA3" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Horizontal Attention Split Graph */}
                <div className="h-28 bg-background/50 border border-outline-variant/30 rounded-xl p-3 flex flex-col mt-3 shrink-0">
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider mb-2 block text-left">Attention Split (Seconds)</span>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Screen Focus', value: screenFocusSeconds, color: '#00ffa3' },
                          { name: 'Paper Focus', value: paperFocusSeconds, color: '#7047eb' },
                          { name: 'Lookaway', value: interruptions * 2, color: '#ff3b30' }
                        ]} 
                        layout="vertical"
                        margin={{ top: 2, right: 10, left: -25, bottom: 2 }}
                      >
                        <XAxis type="number" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {[
                            { color: '#00ffa3' },
                            { color: '#7047eb' },
                            { color: '#ff3b30' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* User B: Opponents Viewports (Mapped side-by-side) */}
            {opponents.map((opt, optIndex) => {
              const playerNum = optIndex + 2;
              return (
                <div key={opt.userId} className="flex-1 h-full relative overflow-hidden group/userb bg-slate-950 border-l border-outline-variant/10">
                  <div className="w-full h-full relative bg-surface-container-low flex items-center justify-center">
                    {opt.shareCamera ? (
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
                        <video 
                          ref={(el) => {
                            if (el) {
                              opponentVideoRefs.current[opt.userId] = el;
                            }
                          }}
                          autoPlay 
                          playsInline 
                          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
                        />
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 z-10 pointer-events-none"></div>
                        
                        {/* Simulated Face mesh overlay corners */}
                        {opt.isActive && (
                          <div className="absolute inset-10 border border-[#7047eb]/20 rounded-lg pointer-events-none z-20">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-[#7047eb] rounded-full animate-ping"></div>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#00ffa3] live-pulse"></span>
                          <span className="font-mono text-[9px] text-[#7047eb] uppercase font-bold tracking-widest">
                            P2P CAM FEED CONNECTED
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Display profile avatar cover
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-black">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#7047eb] bg-surface-container relative shrink-0 shadow-[0_0_30px_rgba(112,71,235,0.4)] animate-pulse">
                          <img alt={opt.name} src={opt.avatarUrl} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-display text-xl font-black text-white italic uppercase tracking-wider">{opt.name}</span>
                        <span className="font-mono text-[9px] text-[#7047eb] uppercase font-bold tracking-widest">WEBCAM SHARING DISABLED</span>
                        <div className="mt-4 max-w-xs text-center px-4">
                          <p className="font-mono text-[10px] text-[#ccbdff] bg-[#7047eb]/5 border border-[#7047eb]/20 rounded-lg p-2.5 uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(112,71,235,0.05)]">
                            ⚡ {motivationQuotes[Math.floor((seconds + 7 + optIndex * 3) / 15) % motivationQuotes.length]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player Detail Badge */}
                  <div className="absolute bottom-24 right-6 z-20 bg-black/60 border border-outline-variant/30 px-4 py-2 rounded-xl backdrop-blur font-mono text-[9px] text-on-surface uppercase tracking-wider text-right">
                    <span className="text-on-surface-variant font-bold">Player {playerNum}:</span> <span className="font-black text-[#7047eb]">{opt.name}</span>
                    <div className="mt-1 flex items-center justify-end gap-1 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.isActive ? 'bg-[#7047eb] live-pulse' : 'bg-on-surface-variant/40'}`}></span>
                      <span>{opt.isActive ? 'Active' : 'Offline'}</span>
                    </div>
                  </div>

                  {/* Hover Overlay for Opponent */}
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-md opacity-0 invisible group-hover/userb:opacity-100 group-hover/userb:visible transition-all duration-300 flex flex-col p-6 z-30">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30 font-mono">
                      <span className="font-black text-xs text-[#7047eb] uppercase tracking-wider">Opponent statistics</span>
                      <span className="text-[10px] text-on-surface-variant font-bold text-right">{opt.name}</span>
                    </div>

                    {/* Opponent stats */}
                    {opt.shareStats ? (
                      <div className="grid grid-cols-2 gap-4 text-left font-mono text-[10px] mb-4">
                        <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                          <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Focus Time</span>
                          <span className="font-display text-base font-black text-primary-fixed">
                            {Math.floor(opt.focusSeconds / 60)}m {opt.focusSeconds % 60}s
                          </span>
                        </div>
                        <div className="bg-background/40 p-2.5 rounded-lg border border-outline-variant/20">
                          <span className="text-on-surface-variant block uppercase font-bold text-[8px] tracking-wider mb-1 text-left">Focus Index</span>
                          <span className="font-display text-base font-black text-primary-fixed">
                            {opt.focusScore}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-background/30 rounded-xl border border-outline-variant/10 text-center mb-4">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-black">STATS SHARE BLOCKED</span>
                      </div>
                    )}

                    {/* Opponent Graph */}
                    {opt.shareGraphs ? (
                      <>
                        <div className="flex-1 min-h-0 bg-background/50 border border-outline-variant/30 rounded-xl p-3 flex flex-col">
                          <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider mb-2 block text-left">Gaze Focus Timeline</span>
                          <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={opt.chartData} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                                <XAxis dataKey="time" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                                <YAxis stroke="#849588" fontSize={8} domain={[0, 100]} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '8px' }} />
                                <Line type="monotone" dataKey="level" stroke="#7047eb" strokeWidth={1.5} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="h-28 bg-background/50 border border-outline-variant/30 rounded-xl p-3 flex flex-col mt-3 shrink-0">
                          <span className="font-mono text-[8px] text-on-surface-variant uppercase font-bold tracking-wider mb-2 block text-left">Attention Split (Estimate)</span>
                          <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={[
                                  { name: 'Screen Focus', value: Math.round(opt.focusSeconds * 0.75), color: '#00ffa3' },
                                  { name: 'Paper Focus', value: Math.round(opt.focusSeconds * 0.25), color: '#7047eb' },
                                  { name: 'Lookaway', value: (opt.interruptions_count || 0) * 2, color: '#ff3b30' }
                                ]} 
                                layout="vertical"
                                margin={{ top: 2, right: 10, left: -25, bottom: 2 }}
                              >
                                <XAxis type="number" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {[
                                    { color: '#00ffa3' },
                                    { color: '#7047eb' },
                                    { color: '#ff3b30' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 bg-background/30 border border-outline-variant/10 rounded-xl flex items-center justify-center text-center p-6">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-black">GRAPHS SHARE BLOCKED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Waiting for Opponents Fallback (If solo in room) */}
            {opponents.length === 0 && (
              <div className="flex-1 h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-black border-l border-outline-variant/30">
                <span className="material-symbols-outlined text-[#7047eb] text-5xl animate-pulse">groups</span>
                <span className="font-display text-sm font-black text-white/40 italic uppercase tracking-wider animate-pulse">WAITING FOR OPPS...</span>
              </div>
            )}

            {/* Dynamic Laser Neon Dividers overlay */}
            {(() => {
              const panelCount = Math.max(2, opponents.length + 1);
              return Array.from({ length: panelCount - 1 }).map((_, divIdx) => {
                const leftPercent = ((divIdx + 1) / panelCount) * 100;
                return (
                  <div key={`vs-divider-${divIdx}`} className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none" style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}>
                    {/* Comic-style Yellow/Black outline Lightning Bolt */}
                    <svg className="absolute h-full w-32 overflow-visible" viewBox="0 0 100 1000" preserveAspectRatio="none">
                      {/* Black outline */}
                      <path 
                        d="M 50,0 L 45,200 L 60,350 L 35,500 L 65,650 L 40,800 L 50,1000" 
                        fill="none" 
                        stroke="#000000" 
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Yellow lightning fill */}
                      <path 
                        d="M 50,0 L 45,200 L 60,350 L 35,500 L 65,650 L 40,800 L 50,1000" 
                        fill="none" 
                        stroke="#facc15" 
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Central Comic Explosion Splat & VS Badge */}
                    <div className="relative flex items-center justify-center w-40 h-40">
                      <svg className="absolute w-full h-full overflow-visible" viewBox="0 0 100 100">
                        {/* Red Explosion Splat */}
                        <polygon 
                          points="50,15 55,33 72,24 65,40 82,40 68,50 82,60 65,60 72,76 55,67 50,85 45,67 28,76 35,60 18,60 32,50 18,40 35,40 28,24 45,33"
                          fill="#ef4444"
                          stroke="#000000"
                          strokeWidth="3.5"
                          strokeLinejoin="miter"
                        />
                      </svg>

                      {/* Yellow Comic-Style VS Text */}
                      <span 
                        className="relative z-10 text-5xl md:text-6xl font-black italic tracking-tighter uppercase select-none"
                        style={{
                          color: '#facc15',
                          fontFamily: '"Impact", "Arial Black", sans-serif',
                          textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000, -4px -4px 0px #000, 0px 4px 0px #000, 0px -4px 0px #000, 4px 0px 0px #000, -4px 0px 0px #000',
                          transform: 'skewX(-10deg) rotate(-5deg)'
                        }}
                      >
                        VS
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Immersive Floating Controls Panel at the bottom center */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 bg-black/75 backdrop-blur-md border border-outline-variant/30 px-6 py-3 rounded-full flex gap-4 items-center shadow-2xl shrink-0 max-w-[90%] overflow-x-auto custom-scrollbar">
            
            <button 
              onClick={() => setCalibrated(false)}
              className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-on-surface px-4 py-1.5 rounded-full font-label-mono text-[9px] font-bold transition-all cursor-pointer uppercase shrink-0"
            >
              Recalibrate
            </button>

            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 shrink-0">
              <button
                onClick={() => {
                  if (ambientPlaying) {
                    stopAmbientSynth();
                  } else {
                    startAmbientSynth();
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-label-mono text-[9px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  ambientPlaying 
                    ? 'bg-error-container/20 border-error text-error' 
                    : 'bg-primary-container text-on-primary border-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">{ambientPlaying ? 'volume_off' : 'volume_up'}</span>
                Synth
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-12 accent-primary-container cursor-pointer h-1 rounded-lg bg-surface-container"
                title="Synth Volume"
              />
            </div>

            {/* Theme Selector */}
            <div className="border-l border-outline-variant/30 pl-4 shrink-0">
              <select
                value={selectedTheme}
                onChange={(e) => handleThemeSelect(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-full px-3 py-1.5 font-label-mono text-[9px] text-on-surface focus:outline-none cursor-pointer uppercase font-bold"
              >
                <option value="dark">Dark Focus</option>
                <option value="pink">Pink Petals</option>
                <option value="green">Forest Sway</option>
                <option value="water">Ocean Ripple</option>
              </select>
            </div>

            {/* Session actions */}
            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 shrink-0">
              <button
                onClick={handleTogglePause}
                className="bg-surface-container border border-outline-variant text-on-surface font-label-mono text-[9px] font-bold px-4 py-1.5 rounded-full cursor-pointer uppercase shrink-0"
              >
                {isActive ? 'Pause' : 'Resume'}
              </button>
              {roomId && (
                <button
                  onClick={() => {
                    setSelfHandsDown(true);
                    handleEndSession('self');
                  }}
                  className="bg-red-950/40 border border-red-500 text-red-400 font-label-mono text-[9px] font-bold px-4 py-1.5 rounded-full cursor-pointer uppercase hover:bg-red-900/60 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] shrink-0 flex items-center gap-1"
                  title="Hands Down forfeit duel instantly"
                >
                  <span className="material-symbols-outlined text-[10px]">back_hand</span>
                  HANDS DOWN
                </button>
              )}
              <button
                onClick={() => handleEndSession()}
                className="bg-error text-on-error font-label-mono text-[9px] font-bold px-4 py-1.5 rounded-full cursor-pointer uppercase hover:bg-red-700 transition-colors shrink-0"
              >
                End Focus
              </button>
            </div>
          </div>

        </main>
      ) : (
        // Render normal layout
        <main className="flex-grow flex flex-col justify-center w-full max-w-7xl mx-auto px-4 py-4 relative z-10 overflow-hidden h-[calc(100vh-80px)]">
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
            <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
              <motion.div
                animate={{
                  borderColor: isFocused ? activeColors.primary : '#FF0055',
                  boxShadow: isFocused ? `0 0 25px ${activeColors.glow}` : '0 0 25px rgba(255, 0, 85, 0.25)'
                }}
                transition={{ duration: 0.6 }}
                className={`flex-grow flex flex-col justify-center items-center p-6 relative overflow-hidden backdrop-blur transition-all duration-500 rounded-2xl border ${
                  selectedTheme === 'pink' ? 'bg-pink-900/10 border-pink-500/30' :
                  selectedTheme === 'green' ? 'bg-green-950/15 border-green-600/30' :
                  selectedTheme === 'water' ? 'bg-cyan-950/15 border-cyan-500/30' :
                  isFocused ? 'clay-card-success' : 'clay-card-error'
                }`}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    isFocused ? 'bg-primary-container live-pulse' : 'bg-error animate-ping'
                  }`}></span>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">
                    Grind: {isFocused ? 'FOCUS ACTIVE' : 'DISTRACTED WARNING'}
                  </span>
                </div>

                <div className="text-center select-none my-auto">
                  <h1 className="font-display text-5xl md:text-6xl font-black text-on-surface tracking-tight font-mono">
                    {formatTimer(seconds)}
                  </h1>
                  <p className="text-xs font-label-mono text-on-surface-variant mt-2 tracking-widest uppercase font-bold">
                    Webcam Multi-Track: Screen & Paper Focus Enabled
                  </p>

                  {selectedTheme === 'dark' && (
                    <motion.p
                      key={currentQuote}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-primary-fixed/80 uppercase font-mono tracking-widest font-bold mt-3 max-w-md mx-auto"
                    >
                      💡 {currentQuote}
                    </motion.p>
                  )}
                </div>

                <div className="w-full flex justify-center mt-2.5">
                  {!sessionStarted ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                        <div className="space-y-0.5">
                          <label className="block text-[7px] font-label-mono text-on-surface-variant uppercase tracking-wider text-center font-bold">
                            Select Objective (Optional)
                          </label>
                          <select
                            value={selectedTaskId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedTaskId(val);
                              const matched = activeTasks.find(t => t.id === val);
                              if (matched) {
                                setSessionName(matched.title);
                              }
                            }}
                            className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 font-label-mono text-[9px] text-on-surface focus:outline-none focus:border-primary-fixed cursor-pointer"
                          >
                            <option value="">-- Custom --</option>
                            {activeTasks.map(t => (
                              <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[7px] font-label-mono text-on-surface-variant uppercase tracking-wider text-center font-bold">
                            Session Name
                          </label>
                          <input
                            type="text"
                            placeholder="Name this study..."
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 font-label-mono text-[9px] text-on-surface focus:outline-none focus:border-primary-fixed transition-all text-center placeholder:text-on-surface-variant/40"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleStartSession}
                        className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[9px] font-bold px-6 py-2 rounded-lg shadow-[0_0_10px_rgba(0,255,163,0.2)] cursor-pointer uppercase tracking-wider mt-1"
                      >
                        Start Your Focus
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={handleTogglePause}
                        className="bg-surface-container border border-outline-variant text-on-surface font-label-mono text-[9px] font-bold px-5 py-2 rounded-lg cursor-pointer uppercase tracking-wider"
                      >
                        {isActive ? 'Pause' : 'Resume'}
                      </button>
                      {roomId && (
                        <button
                          onClick={async () => {
                            // Immediately broadcast forfeit to opponents so they receive it in sub-50ms
                            if (webrtcChannelRef.current) {
                              webrtcChannelRef.current.send({
                                type: 'broadcast',
                                event: 'opponent-forfeit',
                                payload: { forfeiterId: user?.id }
                              });
                            }
                            
                            // Write to DB presence for robustness
                            if (user) {
                              try {
                                await supabase.from('room_presence').upsert({
                                  room_id: roomId,
                                  user_id: user.id,
                                  hands_down: true,
                                  is_active: false,
                                  updated_at: new Date().toISOString()
                                }, { onConflict: 'room_id,user_id' });
                              } catch (err) {
                                console.error("Failed to upsert forfeit status:", err);
                              }
                            }

                            setSelfHandsDown(true);
                            handleEndSession('self');
                          }}
                          className="bg-red-950/40 border border-red-500 text-red-400 font-label-mono text-[9px] font-bold px-5 py-2 rounded-lg cursor-pointer uppercase tracking-wider hover:bg-red-900/60 transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                          <span className="material-symbols-outlined text-[10px]">back_hand</span>
                          Hands Down
                        </button>
                      )}
                      {!roomId && (
                        <button
                          onClick={() => handleEndSession()}
                          className="bg-surface-container border border-error text-error font-label-mono text-[9px] font-bold px-5 py-2 rounded-lg cursor-pointer uppercase tracking-wider"
                        >
                          End Focus
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="grid grid-cols-4 gap-4 shrink-0 font-mono text-xs">
                <div className="clay-card p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div>
                    <span className="text-on-surface-variant uppercase font-bold text-[8px] tracking-wider text-left block">Attention Ratio</span>
                    <span className="font-display text-xl font-black text-primary-fixed mt-1 block">
                      {seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-primary-container h-full" style={{ width: `${seconds > 0 ? (focusSeconds/seconds)*100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="clay-card p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div>
                    <span className="text-on-surface-variant uppercase font-bold text-[8px] tracking-wider text-left block">Focus Allocation</span>
                    <span className="font-display text-[10px] font-black text-on-surface mt-1.5 block truncate">
                      💻{Math.floor(screenFocusSeconds / 60)}m /  📝{Math.floor(paperFocusSeconds / 60)}m
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2 h-1 rounded-full overflow-hidden bg-surface-container-high w-full">
                    <div className="bg-primary-container h-full" style={{ width: `${focusSeconds > 0 ? (screenFocusSeconds/focusSeconds)*100 : 50}%` }}></div>
                    <div className="bg-cyan-400 h-full" style={{ width: `${focusSeconds > 0 ? (paperFocusSeconds/focusSeconds)*100 : 50}%` }}></div>
                  </div>
                </div>

                <div className="clay-card p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <span className="text-on-surface-variant uppercase font-bold text-[8px] tracking-wider text-left block">Longest Streak</span>
                  <span className="font-display text-xl font-black text-secondary-fixed mt-1">{longestStreak}s</span>
                </div>

                <div className="clay-card p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <span className="text-on-surface-variant uppercase font-bold text-[8px] tracking-wider text-left block">Interruptions</span>
                  <span className="font-display text-xl font-black text-error mt-1">{interruptions}</span>
                </div>
              </div>

              <style dangerouslySetInnerHTML={{__html: `
                .no-scrollbar::-webkit-scrollbar {
                  display: none !important;
                }
              `}} />
              <div 
                className="flex gap-4 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory h-[180px] shrink-0 no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="clay-card p-3 flex flex-col shrink-0 w-[48%] min-w-[280px] snap-start hover:scale-[1.01] transition-transform">
                  <h3 className="font-display text-[8px] font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Session Focus Level Index</span>
                    <span className="text-[7px] text-on-surface-variant font-mono">1/3 ➔</span>
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                        <XAxis dataKey="time" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="#849588" fontSize={8} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '8px' }} />
                        <Line type="monotone" dataKey="level" stroke="#00FFA3" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="clay-card p-3 flex flex-col shrink-0 w-[48%] min-w-[280px] snap-start hover:scale-[1.01] transition-transform">
                  <h3 className="font-display text-[8px] font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Focus Streak Timeline</span>
                    <span className="text-[7px] text-on-surface-variant font-mono">2/3 ➔</span>
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={streakChartData} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                        <XAxis dataKey="time" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="#849588" fontSize={8} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '8px' }} />
                        <defs>
                          <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ccbdff" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ccbdff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="streak" stroke="#ccbdff" fillOpacity={1} fill="url(#colorStreak)" strokeWidth={1.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="clay-card p-3 flex flex-col shrink-0 w-[48%] min-w-[280px] snap-start hover:scale-[1.01] transition-transform">
                  <h3 className="font-display text-[8px] font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Screen vs Paper Focus (Secs)</span>
                    <span className="text-[7px] text-on-surface-variant font-mono">3/3 ➔</span>
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Screen', seconds: screenFocusSeconds },
                        { name: 'Paper', seconds: paperFocusSeconds }
                      ]} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="#849588" fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '8px' }} />
                        <Bar dataKey="seconds" radius={[6, 6, 0, 0]}>
                          {
                            [
                              { fill: '#00FFA3' },
                              { fill: '#00C2FF' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1 custom-scrollbar">
              <div className="clay-card p-4 relative overflow-hidden flex flex-col min-h-[220px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider text-left block">Gaze Tracking Feed</span>
                  <div className={`px-2 py-0.5 rounded border text-[8px] font-mono uppercase flex items-center gap-1 ${
                    isFocused ? 'bg-primary-container/10 border-primary-container text-primary-fixed' : 'bg-error-container/10 border-error text-error'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      isFocused ? 'bg-primary-container' : 'bg-error'
                    }`}></span>
                    <span>{isFocused ? 'Focused' : 'Distracted'}</span>
                  </div>
                </div>

                <div className="relative flex-grow bg-background rounded-lg border border-outline-variant overflow-hidden flex items-center justify-center min-h-[160px]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {isFocused && isActive && (
                    <canvas 
                      ref={canvasRef}
                      width={320}
                      height={220}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />
                  )}
                  
                  {cameraActive && isActive && (
                    <div className={`absolute inset-6 border rounded transition-all duration-300 pointer-events-none ${
                      isFocused ? 'border-primary-container/30' : 'border-error/40'
                    }`}>
                      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                      
                      <div className="absolute bottom-1.5 left-1.5 bg-black/75 px-1.5 py-0.5 rounded font-mono text-[7px] text-on-surface uppercase tracking-wider">
                        Gaze: {gazeDirection}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="clay-card p-3.5 flex items-center justify-between">
                <span className="font-label-mono text-xs text-on-surface uppercase font-bold text-left block">Calibration metrics</span>
                <button 
                  onClick={() => setCalibrated(false)}
                  className="bg-primary-container text-on-primary px-3 py-1.5 rounded font-label-mono text-[9px] font-bold hover:bg-primary-fixed cursor-pointer"
                >
                  Recalibrate
                </button>
              </div>

              <ThemeSelector selectedTheme={selectedTheme} setSelectedTheme={handleThemeSelect} />

              <div className="clay-card p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono text-[10px] text-on-surface uppercase font-bold text-left block">Soundscape Synthesizer</span>
                </div>
                
                <div className="flex gap-2">
                  {[
                    { id: 'dark', name: 'Space Drone' },
                    { id: 'pink', name: 'Sweet Chimes' },
                    { id: 'green', name: 'Forest Melodies' },
                    { id: 'water', name: 'Ocean Bubbles' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedAmbient(s.id);
                        if (ambientPlaying) {
                          startAmbientSynth(s.id);
                        }
                      }}
                      className={`flex-1 px-1.5 py-1.5 rounded text-[8px] font-bold font-label-mono uppercase transition-all cursor-pointer border ${
                        selectedAmbient === s.id
                          ? 'bg-secondary-container text-on-secondary border-secondary-container'
                          : 'bg-surface-container text-on-surface border-outline-variant'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  {ambientPlaying ? (
                    <button
                      onClick={stopAmbientSynth}
                      className="w-full bg-error-container/20 border border-error text-error font-label-mono text-[8px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer uppercase"
                    >
                      <span className="material-symbols-outlined text-xs">volume_off</span>
                      Mute Synthesizer
                    </button>
                  ) : (
                    <button
                      onClick={() => startAmbientSynth()}
                      className="w-full bg-primary-container text-on-primary font-label-mono text-[8px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer uppercase shadow-[0_0_10px_rgba(0,255,163,0.15)]"
                    >
                      <span className="material-symbols-outlined text-xs">volume_up</span>
                      Play Soundscape
                    </button>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-outline-variant/25">
                  <div className="flex justify-between font-mono text-[8px] text-on-surface-variant uppercase tracking-wider font-bold">
                    <span>Synthesizer Volume</span>
                    <span className="font-bold text-primary-fixed">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-primary-container cursor-pointer h-1 rounded-lg bg-surface-container"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
      {/* 50 Stats Cyberpunk Battle Results Overlay */}
      {showResultsOverlay && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto flex flex-col items-center justify-start p-6 custom-scrollbar">
          <div className="w-full max-w-4xl space-y-8 my-auto py-8">
            
            {/* Flashing Tournament Header */}
            <div className="text-center space-y-2">
              <h2 className={`font-display text-4xl md:text-6xl font-black uppercase tracking-tighter ${
                battleWinnerName === profile?.name ? 'text-[#00ffa3] drop-shadow-[0_0_20px_rgba(0,255,163,0.5)]' : 'text-[#ff3b30] drop-shadow-[0_0_20px_rgba(255,59,48,0.5)]'
              } animate-pulse`}>
                {battleWinnerName === profile?.name ? 'BATTLE VICTORY' : 'BATTLE DEFEAT'}
              </h2>
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">{battleReason}</p>
            </div>

            {/* Versus Cards */}
            <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
              {/* Player 1 Card */}
              <div className="md:col-span-3 bg-surface-container-high/60 border-2 border-primary-fixed rounded-2xl p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#00ffa3] bg-surface-variant mx-auto">
                  <img src={profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=player'} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-on-surface uppercase truncate">{profile?.name || 'You'}</h3>
                  <span className="font-mono text-xs text-[#00ffa3] font-bold tracking-widest">{p1WinsCount} STATS WON</span>
                </div>
              </div>

              {/* VS Indicator */}
              <div className="md:col-span-1 text-center font-display text-2xl font-black text-on-surface-variant italic">
                VS
              </div>

              {/* Player 2 Card */}
              <div className="md:col-span-3 bg-surface-container-high/60 border-2 border-[#7047eb] rounded-2xl p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#7047eb] bg-surface-variant mx-auto">
                  <img src={opponents[0]?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=opponent'} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-on-surface uppercase truncate">{opponents[0]?.name || 'Opponent'}</h3>
                  <span className="font-mono text-xs text-[#7047eb] font-bold tracking-widest">{p2WinsCount} STATS WON</span>
                </div>
              </div>
            </div>

            {/* 50 stats checklist scrollbox */}
            <div className="bg-surface-container/80 border border-outline-variant/30 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30 font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">
                <span>Player 1 Value</span>
                <span className="text-center">50 Cyberpunk Telemetry Match-ups</span>
                <span>Player 2 Value</span>
              </div>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {battleStatsResults.map((stat: any, idx: number) => {
                  const p1Val = stat.p1;
                  const p2Val = stat.p2;
                  const higherIsBetter = stat.higherIsBetter;
                  const p1Won = higherIsBetter ? (p1Val > p2Val) : (p1Val < p2Val);
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-outline-variant/10">
                      {/* Player 1 Stat */}
                      <span className={`w-24 text-left font-bold ${p1Won ? 'text-[#00ffa3]' : 'text-on-surface-variant'}`}>
                        {p1Val} {p1Won && '✓'}
                      </span>

                      {/* Stat Name */}
                      <span className="text-center text-on-surface text-[10px] uppercase font-bold text-on-surface-variant/80">
                        {stat.name}
                      </span>

                      {/* Player 2 Stat */}
                      <span className={`w-24 text-right font-bold ${!p1Won ? 'text-[#7047eb]' : 'text-on-surface-variant'}`}>
                        {!p1Won && '✓'} {p2Val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dismiss trigger */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowResultsOverlay(false);
                  if (roomId) {
                    router.push(`/rooms/${roomId}`);
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-xs font-black px-8 py-3.5 rounded-xl cursor-pointer uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-105"
              >
                DISMISS & RETURN TO LOBBY
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Forfeit notifications overlay */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {forfeitAlerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-red-950/90 border border-red-500/50 text-red-400 px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm animate-pulse">warning</span>
              <span>{alert}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function StudySessionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">INITIALIZING SPRINT RIG...</p>
      </div>
    }>
      <StudySessionContent />
    </Suspense>
  );
}

// ==========================================
// DELIVERABLE COMPONENTS & DOCUMENTATION
// ==========================================

interface AnimatedBackgroundProps {
  theme: string;
  activeColors: { b1: string; b2: string; b3: string; primary: string; text: string; glow: string };
}

/**
 * 1. AnimatedBackground Component
 * Renders hardware-accelerated CSS animations and gradients corresponding to the active theme.
 */
export function AnimatedBackground({ theme, activeColors }: AnimatedBackgroundProps) {
  // Looping background video URLs matching theme IDs (using open, hotlink-allowed sources)
  const bgVideos: Record<string, string> = {
    pink: 'https://assets.mixkit.co/videos/preview/mixkit-pink-petals-falling-from-a-cherry-blossom-tree-32111-large.mp4',
    green: 'https://assets.mixkit.co/videos/preview/mixkit-trees-in-a-forest-swaying-in-the-wind-4752-large.mp4',
    water: 'https://assets.mixkit.co/videos/preview/mixkit-water-flowing-between-rocks-in-a-river-42861-large.mp4',
  };

  const bgImages: Record<string, string> = {
    dark: '/backgrounds/dark_focus_bg.png',
    pink: '/backgrounds/pink_petals_bg.png',
    green: '/backgrounds/green_forest_bg.png',
    water: '/backgrounds/water_flow_bg.png',
  };

  const hasVideo = theme in bgVideos;
  const currentVideo = bgVideos[theme];
  const currentBgImage = bgImages[theme] || bgImages.dark;

  // Programmatic autoplay trigger on mount to handle browser security contexts
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load(); // Force browser to reload the video source!
      videoRef.current.play().catch(() => {
        // Fallback for strict browser media autoplay blocking policies
      });
    }
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Fallback Static Backdrop for Dark Focus & loading state */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[1000ms] ease-in-out opacity-[0.4] select-none pointer-events-none"
        style={{ backgroundImage: `url(${currentBgImage})` }}
      />

      {/* Hardware-Accelerated Looping Video Background (with enhanced opacity) */}
      {hasVideo && (
        <video
          ref={videoRef}
          key={theme}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-[0.55] transition-all duration-[1000ms] ease-in-out select-none pointer-events-none"
        >
          <source src={currentVideo} type="video/mp4" />
        </video>
      )}

      {/* Background animated fluid blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="fluid-blob blob-1 animate-aurora" style={{ backgroundColor: activeColors.b1 }}></div>
        <div className="fluid-blob blob-2 animate-aurora" style={{ backgroundColor: activeColors.b2, animationDelay: '-5s' }}></div>
        <div className="fluid-blob blob-3 animate-aurora" style={{ backgroundColor: activeColors.b3, animationDelay: '-10s' }}></div>
      </div>

      {/* Pink petals theme background animation */}
      {theme === 'pink' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(20)].map((_, i) => {
            const delay = Math.random() * 8;
            const left = Math.random() * 100;
            const size = 8 + Math.random() * 12;
            const duration = 6 + Math.random() * 6;
            return (
              <span
                key={i}
                className="absolute bg-pink-300/40 rounded-full animate-petal"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 0.75}px`,
                  borderRadius: '50% 0 50% 50%',
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  top: '-5%',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Green theme live plants / leaves background animation */}
      {theme === 'green' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(15)].map((_, i) => {
            const delay = Math.random() * 8;
            const left = Math.random() * 100;
            const size = 10 + Math.random() * 14;
            const duration = 7 + Math.random() * 7;
            return (
              <span
                key={i}
                className="absolute bg-green-500/20 animate-leaf"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size * 0.6}px`,
                  borderRadius: '100% 0 100% 0',
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  top: '-5%',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Water flow bubbles background animation */}
      {theme === 'water' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(25)].map((_, i) => {
            const delay = Math.random() * 8;
            const left = Math.random() * 100;
            const size = 6 + Math.random() * 10;
            const duration = 5 + Math.random() * 5;
            return (
              <span
                key={i}
                className="absolute rounded-full border border-cyan-400/25 bg-cyan-300/10 animate-bubble"
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  bottom: '-5%',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ThemeSelectorProps {
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
}

/**
 * 2. ThemeSelector Component
 * Displays large aesthetic buttons with active highlighting, custom glows, and color previews.
 */
export function ThemeSelector({ selectedTheme, setSelectedTheme }: ThemeSelectorProps) {
  const themesList = [
    { id: 'dark', name: 'Dark Focus', gradient: 'from-slate-900 to-black', glow: 'shadow-[0_0_10px_rgba(0,255,163,0.3)]' },
    { id: 'pink', name: 'Pink Petals', gradient: 'from-pink-300 to-pink-500', glow: 'shadow-[0_0_10px_rgba(255,105,180,0.3)]' },
    { id: 'green', name: 'Green Forest', gradient: 'from-green-600 to-emerald-800', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]' },
    { id: 'water', name: 'Water Flow', gradient: 'from-cyan-400 to-blue-600', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]' }
  ];

  return (
    <div className="clay-card p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-label-mono text-[10px] text-on-surface uppercase font-bold">Rig Aesthetic Theme</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {themesList.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTheme(t.id)}
            className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer border hover:scale-[1.03] text-left focus:outline-none ${
              selectedTheme === t.id
                ? `border-primary-container bg-surface-container-high/80 ${t.glow}`
                : 'border-outline-variant bg-surface-container/40 hover:border-outline'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.gradient} shrink-0`} />
            <span className="font-label-mono text-[9px] uppercase font-bold text-on-surface truncate">
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * =========================================================================
 * EXTENSION GUIDE: HOW TO ADD NEW THEMES & PLUG IN CONTENT
 * =========================================================================
 * 
 * 1. HOW TO ADD A NEW THEME LATER:
 *    a. In the `themeColors` object at the top of StudySessionContent, add your colors configuration:
 *       ```ts
 *       const themeColors = {
 *         // ... existing themes
 *         volcano: {
 *           b1: 'rgba(239, 68, 68, 0.15)', // Blob 1 Color
 *           b2: 'rgba(185, 28, 28, 0.12)', // Blob 2 Color
 *           b3: 'rgba(127, 29, 29, 0.1)',  // Blob 3 Color
 *           primary: '#EF4444',
 *           text: '#FCA5A5',
 *           glow: 'rgba(239, 68, 68, 0.4)'
 *         }
 *       }
 *       ```
 *    b. In the `themesList` inside `<ThemeSelector>`, add your new selection button item:
 *       ```ts
 *       { id: 'volcano', name: 'Volcano Melt', gradient: 'from-red-500 to-orange-600', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' }
 *       ```
 *    c. If you want custom animated elements (like floating sparks or glowing ashes) for the new theme,
 *       add a conditional render check inside the `<AnimatedBackground>` component:
 *       ```tsx
 *       {theme === 'volcano' && (
 *         <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
 *           // Render custom canvas/CSS spark particles here
 *         </div>
 *       )}
 *       ```
 * 
 * 2. WHERE TO PLUG IN REAL STUDY CONTENT:
 *    a. TIMER / FOCUS LOGIC: The page currently listens to `seconds` and `focusSeconds`. You can plug in
 *       custom Pomodoro thresholds, session goals, and rest periods by editing `isActive` hooks.
 *    b. COMPANION STUDY CONTENT (e.g. Flashcards / PDFs / Notes):
 *       Add a tab container alongside the left columns (inside `Left Block` beside stats and graphs) or
 *       replace one of the graphs in the horizontal gallery with a real-time cards/notes flashcard flip card component.
 *    c. DATABASE PERSISTENCE: Upon clicking "End Focus", the handler logs focus metrics to Supabase
 *       via `supabase.from('study_sessions').insert(...)`. You can bind additional metadata metrics
 *       like subject details or task tags by editing this payload insertion schema in `handleEndSession`.
 */

