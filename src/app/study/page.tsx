"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

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
  
  const { user } = useAuth();
  
  // Timer & Session state
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Mode selection states (Screen vs Paper)
  const [studyMode, setStudyMode] = useState<'screen' | 'paper'>('screen');
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
  const [focusScore, setFocusScore] = useState(98);
  const [interruptions, setInterruptions] = useState(0);
  const [gazeDirection, setGazeDirection] = useState('Calibrating');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { time: '0:00', level: 98 }
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
      // If Paper Mode is active, skip gaze calculations
      if (studyMode === 'paper') {
        setGazeDirection('Paper Mode');
        setIsFocused(true);
        return;
      }

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

          if (dir === 'Center') {
            setIsFocused(true);
            setFocusScore(prev => Math.min(100, prev + 1));
          } else {
            setIsFocused(false);
            setFocusScore(prev => Math.max(10, prev - 2));
          }
        }
      } else {
        setGazeDirection('Face Undetected');
        setIsFocused(false);
        setFocusScore(prev => Math.max(10, prev - 3));
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
    if (!user) return;
    setIsActive(true);
    
    // Set initial mode change log
    const initialLog: ModeLog = { timestamp: new Date().toISOString(), mode: studyMode };
    setModeChanges([initialLog]);

    try {
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
      }
    } catch (e) {
      console.error(e);
    }

    if (studyMode === 'screen' && !cameraActive) {
      initializeFaceMesh();
    }
  };

  const handleTogglePause = () => {
    setIsActive(!isActive);
  };

  const handleEndSession = async () => {
    setIsActive(false);
    if (cameraInstRef.current) {
      cameraInstRef.current.stop();
    }

    if (sessionId && user) {
      try {
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

        const rewardTokens = Math.round(focusSeconds / 120);
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
              description: `Focus reward: screen ${screenFocusSeconds}s, paper ${paperFocusSeconds}s`
            });
          }
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

      } catch (e) {
        console.error(e);
      }
    }

    setTimeout(() => {
      if (roomId) {
        router.push(`/rooms/${roomId}`);
      } else {
        router.push('/dashboard');
      }
    }, 2500);
  };

  const toggleStudyMode = (nextMode: 'screen' | 'paper') => {
    if (studyMode === nextMode) return;
    setStudyMode(nextMode);

    const log: ModeLog = { timestamp: new Date().toISOString(), mode: nextMode };
    setModeChanges(prev => [...prev, log]);

    if (nextMode === 'screen' && !cameraActive) {
      initializeFaceMesh();
    } else if (nextMode === 'paper' && cameraInstRef.current) {
      cameraInstRef.current.stop();
      setCameraActive(false);
    }
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
            setChartData(c => [...c, { time: minStr, level: isFocused ? focusScore : 15 }]);
          }
          return nextSec;
        });

        // Increment mode-specific focus metrics
        if (studyMode === 'screen') {
          if (isFocused) {
            setScreenFocusSeconds(prev => prev + 1);
            setFocusSeconds(prev => prev + 1);
            setCurrentStreak(prev => {
              const next = prev + 1;
              if (next > longestStreak) setLongestStreak(next);
              return next;
            });
          } else {
            setCurrentStreak(0);
          }
        } else {
          // Paper Mode assumes user is 100% focused by default
          setPaperFocusSeconds(prev => prev + 1);
          setFocusSeconds(prev => prev + 1);
          setIsFocused(true);
          setFocusScore(98);
          setCurrentStreak(prev => {
            const next = prev + 1;
            if (next > longestStreak) setLongestStreak(next);
            return next;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isFocused, studyMode, focusScore, longestStreak]);

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

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative font-sans overflow-x-hidden">
      
      {/* Calibration Overlay */}
      <AnimatePresence>
        {!calibrated && studyMode === 'screen' && (
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

      <main className="flex-grow flex flex-col items-center justify-center max-w-7xl mx-auto w-full px-6 py-12">
        
        {/* Toggle between Screen Mode & Paper Mode */}
        <div className="mb-6 flex bg-surface-container border border-outline-variant rounded-xl p-1 font-label-mono text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => toggleStudyMode('screen')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              studyMode === 'screen' ? 'bg-primary-container text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">monitor</span>
            📺 Screen Mode
          </button>
          <button
            onClick={() => toggleStudyMode('paper')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              studyMode === 'paper' ? 'bg-blue-600 text-white shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            📄 Paper Mode
          </button>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block: Clocks and charts */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              animate={{
                borderColor: studyMode === 'paper' 
                  ? '#00C2FF' 
                  : (isFocused ? '#00FFA3' : '#FF0055'),
                backgroundColor: studyMode === 'paper'
                  ? 'rgba(0, 194, 255, 0.02)'
                  : (isFocused ? 'rgba(0, 255, 163, 0.02)' : 'rgba(255, 0, 85, 0.02)')
              }}
              transition={{ duration: 0.6 }}
              className="border rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur shadow-2xl"
            >
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  studyMode === 'paper' 
                    ? 'bg-blue-500' 
                    : (isFocused ? 'bg-primary-container live-pulse' : 'bg-error animate-ping')
                }`}></span>
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                  Grind: {studyMode === 'paper' ? 'PAPER ACTIVE' : (isFocused ? 'FOCUS ACTIVE' : 'DISTRACTED WARNING')}
                </span>
              </div>

              {studyMode === 'paper' && (
                <div className="absolute top-4 right-4 bg-blue-600/15 border border-blue-500/40 text-blue-400 font-label-mono text-[8px] font-bold px-2 py-0.5 rounded">
                  📄 Paper Mode Active
                </div>
              )}

              <div className="text-center mt-8 mb-12">
                <h1 className="font-display text-5xl md:text-6xl font-black text-on-surface tracking-tight font-mono">
                  {formatTimer(seconds)}
                </h1>
                <p className="text-sm font-label-mono text-on-surface-variant mt-2 tracking-widest uppercase">
                  {studyMode === 'screen' ? 'MediaPipe Gaze tracking' : 'Daily Schedule block log'}
                </p>
              </div>

              <div className="flex gap-4">
                {!sessionId ? (
                  <button
                    onClick={handleStartSession}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-xs font-bold px-8 py-3.5 rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.25)] cursor-pointer"
                  >
                    Start Run
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleTogglePause}
                      className="bg-surface-variant border border-outline-variant text-on-surface font-label-mono text-xs font-bold px-6 py-3 rounded-lg cursor-pointer"
                    >
                      {isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="bg-surface-variant border border-error text-on-surface font-label-mono text-xs font-bold px-6 py-3 rounded-lg cursor-pointer"
                    >
                      Finish Run
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Run summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
                <span className="text-on-surface-variant uppercase">Attention Ratio</span>
                <span className="font-display text-2xl font-black text-primary-fixed mt-2">
                  {seconds > 0 ? Math.round((focusSeconds / seconds) * 100) : 100}%
                </span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
                <span className="text-on-surface-variant uppercase">Focus Time</span>
                <span className="font-display text-2xl font-black text-on-surface mt-2">{Math.floor(focusSeconds / 60)}m {focusSeconds % 60}s</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
                <span className="text-on-surface-variant uppercase">Longest Streak</span>
                <span className="font-display text-2xl font-black text-secondary-fixed mt-2">{longestStreak}s</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between">
                <span className="text-on-surface-variant uppercase">Interruptions</span>
                <span className="font-display text-2xl font-black text-error mt-2">{interruptions}</span>
              </div>
            </div>

            {/* Focus level line chart */}
            <div className="card-base p-6 space-y-4">
              <h3 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Session focus level index</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#849588" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '9px' }} />
                    <Line type="monotone" dataKey="level" stroke={studyMode === 'paper' ? '#00C2FF' : '#00FFA3'} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Block: Camera feed & trackers */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 relative overflow-hidden flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Gaze Feed</span>
                <div className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase flex items-center gap-1 ${
                  studyMode === 'paper' 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                    : (isFocused ? 'bg-primary-container/10 border-primary-container text-primary-fixed' : 'bg-error-container/10 border-error text-error')
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    studyMode === 'paper' ? 'bg-blue-500' : (isFocused ? 'bg-primary-container' : 'bg-error')
                  }`}></span>
                  <span>{studyMode === 'paper' ? 'Paper Mode' : (isFocused ? 'Focused' : 'Distracted')}</span>
                </div>
              </div>

              {/* Webcam view port */}
              <div className="relative flex-grow bg-background rounded-lg border border-outline-variant overflow-hidden flex items-center justify-center min-h-[220px]">
                {studyMode === 'screen' ? (
                  <>
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
                  </>
                ) : (
                  <div className="text-center p-6 space-y-2 select-none">
                    <span className="material-symbols-outlined text-4xl text-blue-500">menu_book</span>
                    <p className="text-[10px] text-on-surface-variant font-mono">Webcam tracking suspended</p>
                  </div>
                )}
              </div>
            </div>

            {studyMode === 'screen' && (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between">
                <span className="font-label-mono text-xs text-on-surface uppercase font-bold">Calibration thresholds</span>
                <button 
                  onClick={() => setCalibrated(false)}
                  className="bg-primary-container text-on-primary px-3 py-1.5 rounded font-label-mono text-[10px] font-bold hover:bg-primary-fixed cursor-pointer"
                >
                  Recalibrate
                </button>
              </div>
            )}
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
