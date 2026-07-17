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

function StudySessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('roomId');
  
  const { user, refreshProfile, refreshWallet } = useAuth();
  
  // Timer & Session state
  const [isActive, setIsActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
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
  const [focusScore, setFocusScore] = useState(0); // Starts at 0
  const [interruptions, setInterruptions] = useState(0);
  const [gazeDirection, setGazeDirection] = useState('Calibrating');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { time: '0:00', level: 0 } // Starts at 0
  ]);
  const [streakChartData, setStreakChartData] = useState<any[]>([
    { time: '0:00', streak: 0 }
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraInstRef = useRef<any>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize MediaPipe Gaze Tracking
  const initializeFaceMesh = () => {
    const FaceMesh = (window as any).FaceMesh;
    const Camera = (window as any).Camera;

    if (!FaceMesh || !Camera || !videoRef.current) {
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

          if (hGaze < calibThresholds.left) {
            dir = 'Left';
          } else if (hGaze > calibThresholds.right) {
            dir = 'Right';
          } else if (vGaze > calibThresholds.down) {
            dir = 'Down';
          }

          setGazeDirection(dir);

          // Combined: Center (screen) or Down (paper/book) are both focused
          if (dir === 'Center' || dir === 'Down') {
            setIsFocused(true);
            setFocusScore(prev => Math.min(100, parseFloat((prev + 0.15).toFixed(2))));
          } else {
            setIsFocused(prev => {
              if (prev) {
                setInterruptions(i => i + 1);
              }
              return false;
            });
            setFocusScore(prev => Math.max(0, prev - 8)); // Drop faster
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

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 320,
      height: 240
    });

    camera.start();
    cameraInstRef.current = camera;
    faceMeshRef.current = faceMesh;
    setCameraActive(true);
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
            paper_focus_seconds: 0
          })
          .select()
          .single();

        if (!error && data) {
          setSessionId(data.id);
        } else if (error) {
          console.error("Failed to create study session row:", error.message);
        }
      } catch (e) {
        console.error("Error creating study session:", e);
      }
    }

    if (!cameraActive) {
      initializeFaceMesh();
    }
  };

  const handleTogglePause = () => {
    setIsActive(!isActive);
  };

  const handleEndSession = async () => {
    setIsActive(false);
    setSessionStarted(false);
    if (cameraInstRef.current) {
      cameraInstRef.current.stop();
    }

    if (sessionId && user) {
      try {
        // Await the session update so it isn't aborted during navigation
        await supabase
          .from('study_sessions')
          .update({
            end_time: new Date().toISOString(),
            focus_seconds: focusSeconds,
            total_seconds: seconds,
            mode_changes: modeChanges,
            screen_focus_seconds: screenFocusSeconds,
            paper_focus_seconds: paperFocusSeconds
          })
          .eq('id', sessionId);

        const rewardMultiplier = user?.user_metadata?.is_pro === true ? 2 : 1;
        const rewardTokens = Math.round(focusSeconds / 120) * rewardMultiplier;
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
              description: `Focus reward${rewardMultiplier > 1 ? ' (2x PRO Multiplier)' : ''}: screen ${screenFocusSeconds}s, paper ${paperFocusSeconds}s`
            });
          }
        }

        // Refresh global state so headers and profile display the new balances/hours immediately
        await refreshWallet();
        await refreshProfile();

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

      } catch (e) {
        console.error("Failed to save end session stats:", e);
      }
    }

    // Short timeout to let the confetti effect execute before route changes
    setTimeout(() => {
      if (roomId) {
        router.push(`/rooms/${roomId}`);
      } else {
        router.push('/dashboard');
      }
    }, 2000);
  };

  const syncSessionProgress = async () => {
    if (!sessionId || !user) return;
    try {
      await supabase
        .from('study_sessions')
        .update({
          focus_seconds: focusSeconds,
          total_seconds: seconds,
          mode_changes: modeChanges,
          screen_focus_seconds: screenFocusSeconds,
          paper_focus_seconds: paperFocusSeconds
        })
        .eq('id', sessionId);
    } catch (e) {
      console.error(e);
    }
  };

  // Timer Tick Loop
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const nextSec = prev + 1;
          if (nextSec % 10 === 0) {
            const minStr = `${Math.floor(nextSec / 60)}:${(nextSec % 60).toString().padStart(2, '0')}`;
            setChartData(c => [...c, { time: minStr, level: isFocused ? focusScore : 0 }]);
            setStreakChartData(s => [...s, { time: minStr, streak: isFocused ? currentStreak : 0 }]);
          }
          return nextSec;
        });

        if (isFocused && focusScore >= 75) {
          setFocusSeconds(prev => prev + 1);
          if (gazeDirection === 'Center') {
            setScreenFocusSeconds(prev => prev + 1);
          } else if (gazeDirection === 'Down') {
            setPaperFocusSeconds(prev => prev + 1);
          }
          setCurrentStreak(prev => {
            const next = prev + 1;
            if (next > longestStreak) setLongestStreak(next);
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
  }, [isActive, isFocused, focusScore, longestStreak, gazeDirection, currentStreak]);

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
  }, [isActive, seconds, focusSeconds, modeChanges]);

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

  const themeColors: Record<string, { b1: string, b2: string, b3: string }> = {
    default: { b1: '#00ffa3', b2: '#00c2ff', b3: '#9e00ff' },
    cyberpunk: { b1: '#ff007f', b2: '#ffea00', b3: '#00f6ff' },
    glacier: { b1: '#00d2ff', b2: '#ffffff', b3: '#003cff' },
    volcano: { b1: '#ff0000', b2: '#ff7b00', b3: '#550000' }
  };

  const activeColors = themeColors[selectedTheme] || themeColors.default;
  const isPro = user?.user_metadata?.is_pro === true;

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative font-sans overflow-x-hidden">
      
      {/* Background animated fluid blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="fluid-blob blob-1" style={{ backgroundColor: activeColors.b1 }}></div>
        <div className="fluid-blob blob-2" style={{ backgroundColor: activeColors.b2 }}></div>
        <div className="fluid-blob blob-3" style={{ backgroundColor: activeColors.b3 }}></div>
      </div>

      {/* Calibration Overlay */}
      <AnimatePresence>
        {!calibrated && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-md space-y-6">
              <h2 className="font-display text-xl font-black text-primary-fixed uppercase tracking-wider">Webcam Calibration</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Calibration optimizes FaceMesh thresholds. Look directly at the red dots on screen.
              </p>
              
              <div className="relative h-64 w-full border border-outline-variant/30 rounded-xl bg-surface flex items-center justify-center">
                {calibrationStep === 0 && (
                  <button 
                    onClick={() => runCalibration(1)}
                    className="bg-primary-container text-on-primary font-label-mono text-[10px] font-bold px-6 py-2.5 rounded-lg hover:bg-primary-fixed cursor-pointer"
                  >
                    Start Calibration
                  </button>
                )}

                {calibrationStep === 1 && (
                  <button 
                    onClick={() => runCalibration(2)}
                    className="absolute top-4 left-4 w-6 h-6 rounded-full bg-error border-2 border-white animate-ping cursor-pointer"
                  />
                )}

                {calibrationStep === 2 && (
                  <button 
                    onClick={() => runCalibration(3)}
                    className="w-6 h-6 rounded-full bg-error border-2 border-white animate-ping cursor-pointer"
                  />
                )}

                {calibrationStep === 3 && (
                  <button 
                    onClick={() => runCalibration(4)}
                    className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-error border-2 border-white animate-ping cursor-pointer"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow flex flex-col items-center justify-center max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block: Clocks and charts */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              animate={{
                borderColor: isFocused ? '#00FFA3' : '#FF0055',
                backgroundColor: isFocused ? 'rgba(0, 255, 163, 0.03)' : 'rgba(255, 0, 85, 0.03)'
              }}
              transition={{ duration: 0.6 }}
              className={`clay-card p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-t-white/10 ${isFocused ? 'clay-card-success' : 'clay-card-error'}`}
            >
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isFocused ? 'bg-primary-container live-pulse' : 'bg-error animate-ping'
                }`}></span>
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                  Grind: {isFocused ? 'FOCUS ACTIVE' : 'DISTRACTED WARNING'}
                </span>
              </div>

              <div className="text-center mt-8 mb-12 select-none">
                <h1 className="font-display text-5xl md:text-6xl font-black text-on-surface tracking-tight font-mono">
                  {formatTimer(seconds)}
                </h1>
                <p className="text-sm font-label-mono text-on-surface-variant mt-2 tracking-widest uppercase">
                  Webcam Multi-Track: Screen & Paper Focus Enabled
                </p>
              </div>

              <div className="flex gap-4">
                {!sessionStarted ? (
                  <button
                    onClick={handleStartSession}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-xs font-bold px-8 py-3.5 rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.25)] cursor-pointer uppercase tracking-wider"
                  >
                    Start Your Focus
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleTogglePause}
                      className="bg-surface-container-high border border-outline-variant text-on-surface font-label-mono text-xs font-bold px-6 py-3 rounded-lg cursor-pointer uppercase tracking-wider"
                    >
                      {isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="bg-surface-container-high border border-error text-error font-label-mono text-xs font-bold px-6 py-3 rounded-lg cursor-pointer uppercase tracking-wider"
                    >
                      End Focus
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Run summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="clay-card p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <span className="text-on-surface-variant uppercase font-bold text-[9px]">Attention Ratio</span>
                <span className="font-display text-2xl font-black text-primary-fixed mt-2">
                  {seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 0}%
                </span>
              </div>
              <div className="clay-card p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <span className="text-on-surface-variant uppercase font-bold text-[9px]">Focus Time</span>
                <span className="font-display text-2xl font-black text-on-surface mt-2">{Math.floor(focusSeconds / 60)}m {focusSeconds % 60}s</span>
              </div>
              <div className="clay-card p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <span className="text-on-surface-variant uppercase font-bold text-[9px]">Longest Streak</span>
                <span className="font-display text-2xl font-black text-secondary-fixed mt-2">{longestStreak}s</span>
              </div>
              <div className="clay-card p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <span className="text-on-surface-variant uppercase font-bold text-[9px]">Interruptions</span>
                <span className="font-display text-2xl font-black text-error mt-2">{interruptions}</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Focus Level Index */}
              <div className="clay-card p-6 space-y-4 hover:scale-[1.01] transition-transform">
                <h3 className="font-display text-[10px] font-bold text-on-surface uppercase tracking-wider">Session Focus Level Index</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#849588" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '9px' }} />
                      <Line type="monotone" dataKey="level" stroke="#00FFA3" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Focus Streak Timeline */}
              <div className="clay-card p-6 space-y-4 hover:scale-[1.01] transition-transform">
                <h3 className="font-display text-[10px] font-bold text-on-surface uppercase tracking-wider">Focus Streak Timeline</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={streakChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '9px' }} />
                      <defs>
                        <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ccbdff" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ccbdff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="streak" stroke="#ccbdff" fillOpacity={1} fill="url(#colorStreak)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Focus Allocation */}
              <div className="clay-card p-6 space-y-4 md:col-span-2 hover:scale-[1.01] transition-transform">
                <h3 className="font-display text-[10px] font-bold text-on-surface uppercase tracking-wider">Screen vs Paper Focus Allocation (Seconds)</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Screen Focus', seconds: screenFocusSeconds },
                      { name: 'Paper Focus', seconds: paperFocusSeconds }
                    ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '9px' }} />
                      <Bar dataKey="seconds" radius={[10, 10, 0, 0]}>
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

          {/* Right Block: Camera feed & trackers */}
          <div className="lg:col-span-4 space-y-4">
            <div className="clay-card p-4 relative overflow-hidden flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Gaze Feed</span>
                <div className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase flex items-center gap-1 ${
                  isFocused ? 'bg-primary-container/10 border-primary-container text-primary-fixed' : 'bg-error-container/10 border-error text-error'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isFocused ? 'bg-primary-container' : 'bg-error'
                  }`}></span>
                  <span>{isFocused ? 'Focused' : 'Distracted'}</span>
                </div>
              </div>

              {/* Webcam view port */}
              <div className="relative flex-grow bg-background rounded-lg border border-outline-variant overflow-hidden flex items-center justify-center min-h-[220px]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Bounding trackers corner overlay */}
                {cameraActive && isActive && (
                  <div className={`absolute inset-8 border-2 rounded transition-all duration-300 pointer-events-none ${
                    isFocused ? 'border-primary-container/30' : 'border-error/40'
                  }`}>
                    <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                    <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${isFocused ? 'border-primary-container' : 'border-error'}`}></div>
                    
                    <div className="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded font-mono text-[8px] text-on-surface uppercase tracking-wider">
                      Look: {gazeDirection}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="clay-card p-4 flex items-center justify-between">
              <span className="font-label-mono text-xs text-on-surface uppercase font-bold">Calibration thresholds</span>
              <button 
                onClick={() => setCalibrated(false)}
                className="bg-primary-container text-on-primary px-3 py-1.5 rounded font-label-mono text-[10px] font-bold hover:bg-primary-fixed cursor-pointer"
              >
                Recalibrate
              </button>
            </div>

            {/* Pro Theme Selector (Only unlocked for PRO) */}
            <div className="clay-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-mono text-[10px] text-on-surface uppercase font-bold">Rig Aesthetic Theme</span>
                {isPro ? (
                  <span className="text-[7px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_5px_rgba(234,179,8,0.2)]">PRO UNLOCKED</span>
                ) : (
                  <span className="text-[7px] bg-surface-variant border border-outline-variant text-on-surface-variant px-1 py-0.5 rounded font-bold uppercase">PRO ONLY</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'default', name: 'Default', disabled: false },
                  { id: 'cyberpunk', name: 'Cyberpunk', disabled: !isPro },
                  { id: 'glacier', name: 'Glacier', disabled: !isPro },
                  { id: 'volcano', name: 'Volcano', disabled: !isPro }
                ].map(t => (
                  <button
                    key={t.id}
                    disabled={t.disabled}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold font-label-mono uppercase transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      selectedTheme === t.id
                        ? 'bg-primary-container text-on-primary border-primary-container'
                        : 'bg-surface-container-high text-on-surface border-outline-variant hover:border-outline'
                    } ${t.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {t.disabled && <span className="material-symbols-outlined text-[10px]">lock</span>}
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
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
