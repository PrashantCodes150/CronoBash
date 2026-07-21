"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseFocusStatsProps {
  roomId: string;
  userId: string;
  sessionDurationSeconds: number;
}

export function useFocusStats({ roomId, userId, sessionDurationSeconds }: UseFocusStatsProps) {
  // Counters & Calculations
  const [effectiveFocusSeconds, setEffectiveFocusSeconds] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [isFakeCam, setIsFakeCam] = useState(false);
  const [activeDistraction, setActiveDistraction] = useState<string | null>(null);
  
  const [distractionCounts, setDistractionCounts] = useState({
    'hand-down': 0,
    'gaze-away': 0,
    'eye-closed': 0,
    'face-absent': 0,
    'static-frame': 0
  });

  // Micro-movements tracking for fake-camera detection (sliding window of 10 samples)
  const noseMovementsRef = useRef<{ x: number; y: number }[]>([]);
  
  // Continuous tracking timers
  const absentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gazeAwayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eyesClosedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const staticTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handDownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats lockouts for ignore windows
  const SETUP_IGNORE_SEC = 30;
  const WRAPUP_IGNORE_SEC = 10;

  // Track if a distraction type is currently active to avoid incrementing multiple times per event
  const activeTypesRef = useRef<Record<string, boolean>>({
    'hand-down': false,
    'gaze-away': false,
    'eye-closed': false,
    'face-absent': false,
    'static-frame': false
  });

  // Update second counter
  useEffect(() => {
    if (!roomId || !userId) return;

    const interval = setInterval(() => {
      setTotalElapsedTime(prev => {
        const nextTime = prev + 1;
        
        // Evaluate focus within valid timer boundaries
        if (nextTime > SETUP_IGNORE_SEC && nextTime < (sessionDurationSeconds - WRAPUP_IGNORE_SEC)) {
          // If no active distraction and not fake cam, user gets effective focus seconds
          const isDistracted = Object.values(activeTypesRef.current).some(v => v === true);
          if (!isDistracted && !isFakeCam) {
            setEffectiveFocusSeconds(f => f + 1);
          } else if (isDistracted) {
            // Apply 10 second penalty for active distraction
            setEffectiveFocusSeconds(f => Math.max(0, f - 10));
          }
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roomId, userId, sessionDurationSeconds, isFakeCam]);

  // Periodic database log syncs (every 60 seconds)
  useEffect(() => {
    if (!roomId || !userId || totalElapsedTime <= SETUP_IGNORE_SEC) return;

    if (totalElapsedTime % 60 === 0) {
      const minuteIndex = Math.floor(totalElapsedTime / 60);
      const focusPercent = totalElapsedTime > 0 ? Math.min(100, Math.floor((effectiveFocusSeconds / totalElapsedTime) * 100)) : 0;
      
      supabase
        .from('focus_timeline')
        .upsert({
          room_id: roomId,
          user_id: userId,
          minute_index: minuteIndex,
          focus_percent: isFakeCam ? 0 : focusPercent
        })
        .then(({ error }) => {
          if (error) console.error("Error logging focus timeline:", error);
        });
    }
  }, [totalElapsedTime, roomId, userId, effectiveFocusSeconds, isFakeCam]);

  // Helper to trigger and log a distraction event
  const triggerDistraction = (type: keyof typeof distractionCounts, durationSec = 3) => {
    if (activeTypesRef.current[type]) return; // Already active

    activeTypesRef.current[type] = true;
    setActiveDistraction(type);
    setDistractions(d => d + 1);
    setDistractionCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));

    // Post log entry to DB
    supabase
      .from('distraction_logs')
      .insert({
        room_id: roomId,
        user_id: userId,
        type: type,
        duration_sec: durationSec
      })
      .then(({ error }) => {
        if (error) console.error("Error logging distraction:", error);
      });
  };

  const clearDistraction = (type: keyof typeof distractionCounts) => {
    activeTypesRef.current[type] = false;
    if (activeDistraction === type) {
      // Find another active distraction or set to null
      const remaining = Object.keys(activeTypesRef.current).find(k => activeTypesRef.current[k]) || null;
      setActiveDistraction(remaining);
    }
  };

  // Main input telemetry analyzer (called by web-cams detection frames loops)
  const updateTelemetry = (
    facePresent: boolean,
    eyesOpen: boolean,
    gazeCenter: boolean,
    noseX: number,
    noseY: number,
    isElbowOnTable = false
  ) => {
    if (totalElapsedTime < SETUP_IGNORE_SEC) return; // Setup grace window

    // 1. Face Presence Verification (10-second absent rule)
    if (!facePresent) {
      if (!absentTimerRef.current) {
        absentTimerRef.current = setTimeout(() => {
          triggerDistraction('face-absent', 10);
        }, 10000);
      }
    } else {
      if (absentTimerRef.current) {
        clearTimeout(absentTimerRef.current);
        absentTimerRef.current = null;
      }
      clearDistraction('face-absent');
    }

    // 2. Eyes Open Validation (3-second sleeping/closed rule)
    if (facePresent && !eyesOpen) {
      if (!eyesClosedTimerRef.current) {
        eyesClosedTimerRef.current = setTimeout(() => {
          triggerDistraction('eye-closed', 3);
        }, 3000);
      }
    } else {
      if (eyesClosedTimerRef.current) {
        clearTimeout(eyesClosedTimerRef.current);
        eyesClosedTimerRef.current = null;
      }
      clearDistraction('eye-closed');
    }

    // 3. Gaze Center Alignment (5-second off-screen gaze rule)
    if (facePresent && !gazeCenter) {
      if (!gazeAwayTimerRef.current) {
        gazeAwayTimerRef.current = setTimeout(() => {
          triggerDistraction('gaze-away', 5);
        }, 5000);
      }
    } else {
      if (gazeAwayTimerRef.current) {
        clearTimeout(gazeAwayTimerRef.current);
        gazeAwayTimerRef.current = null;
      }
      clearDistraction('gaze-away');
    }

    // 4. Hand-Down Detection (3-second elbow posture rule)
    if (isElbowOnTable) {
      if (!handDownTimerRef.current) {
        handDownTimerRef.current = setTimeout(() => {
          triggerDistraction('hand-down', 3);
        }, 3000);
      }
    } else {
      if (handDownTimerRef.current) {
        clearTimeout(handDownTimerRef.current);
        handDownTimerRef.current = null;
      }
      clearDistraction('hand-down');
    }

    // 5. Micro-Movements (Fake Camera loop check via nose coordinates deviation)
    if (facePresent) {
      const coords = noseMovementsRef.current;
      coords.push({ x: noseX, y: noseY });
      if (coords.length > 15) {
        coords.shift();
      }

      if (coords.length >= 10) {
        // Calculate standard deviation of coordinates
        const meanX = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
        const meanY = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;
        
        const varianceX = coords.reduce((sum, c) => sum + Math.pow(c.x - meanX, 2), 0) / coords.length;
        const varianceY = coords.reduce((sum, c) => sum + Math.pow(c.y - meanY, 2), 0) / coords.length;
        
        const stdDev = Math.sqrt(varianceX + varianceY);

        // A frozen or looped camera has absolute zero deviation (gaze-less loop stdDev < 0.15px)
        if (stdDev < 0.15) {
          if (!staticTimerRef.current) {
            staticTimerRef.current = setTimeout(() => {
              triggerDistraction('static-frame', 10);
              setIsFakeCam(true);
            }, 10000);
          }
        } else {
          if (staticTimerRef.current) {
            clearTimeout(staticTimerRef.current);
            staticTimerRef.current = null;
          }
          clearDistraction('static-frame');
          setIsFakeCam(false);
        }
      }
    }
  };

  // Consistency multiplier calculation
  const focusRatio = totalElapsedTime > 0 ? (effectiveFocusSeconds / totalElapsedTime) : 1;
  let consistencyMultiplier = 1.0;
  if (focusRatio > 0.8) {
    consistencyMultiplier = 1.2;
  } else if (focusRatio < 0.5) {
    consistencyMultiplier = 0.8;
  }

  // Calculate final score
  const focusScore = isFakeCam 
    ? 0 
    : Math.round((effectiveFocusSeconds / (distractions + 1)) * consistencyMultiplier);

  return {
    focusScore,
    effectiveFocusSeconds,
    distractions,
    distractionCounts,
    activeDistraction,
    isFakeCam,
    consistencyMultiplier,
    updateTelemetry
  };
}
