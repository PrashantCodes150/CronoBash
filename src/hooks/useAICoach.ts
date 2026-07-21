"use client";

import { useEffect, useRef } from 'react';
import { speakAlert } from '@/lib/speechSynthesis';

interface AICoachOptions {
  enabled: boolean;
  volume: number;
  language: string; // 'hi-IN' | 'en-US'
  customMessage?: string;
  isFocused: boolean;
  distractionCount: number;
  faceDetected: boolean;
}

export function useAICoach({
  enabled,
  volume,
  language,
  customMessage,
  isFocused,
  distractionCount,
  faceDetected
}: AICoachOptions) {
  const lastSpokenRef = useRef<string | null>(null);
  const strikeAlertedRef = useRef<number>(0);
  const gazeAwayStartRef = useRef<number | null>(null);
  const eyesClosedStartRef = useRef<number | null>(null);

  // Trigger alerts based on focus tracking logs
  useEffect(() => {
    if (!enabled) return;

    // 1. Distraction strike alerts
    if (distractionCount >= 3 && distractionCount > strikeAlertedRef.current) {
      strikeAlertedRef.current = distractionCount;
      const msg = customMessage || (language === 'hi-IN' 
        ? "Focus kar bhai, distraction badh rahi hai!" 
        : "Focus up, warnings are increasing!");
      speakAlert(msg, language, volume / 100);
    }

    // Reset strike warnings tracker on session resets
    if (distractionCount === 0) {
      strikeAlertedRef.current = 0;
    }
  }, [distractionCount, enabled, language, volume, customMessage]);

  // Track gaze and eye durations
  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();

    // 2. Gaze-away detection (user looks away from screen)
    if (!isFocused && faceDetected) {
      if (gazeAwayStartRef.current === null) {
        gazeAwayStartRef.current = now;
      } else if (now - gazeAwayStartRef.current >= 5000) {
        // Gaze away for 5 seconds
        speakAlert(
          language === 'hi-IN' ? "Back to work! Screen dekh!" : "Back to work! Eyes on screen!",
          language,
          volume / 100
        );
        gazeAwayStartRef.current = now; // reset timer to repeat alert if they continue looking away
      }
    } else {
      gazeAwayStartRef.current = null;
    }

    // 3. Eye-closed detection (user is sleeping/closing eyes)
    if (!isFocused && !faceDetected) {
      if (eyesClosedStartRef.current === null) {
        eyesClosedStartRef.current = now;
      } else if (now - eyesClosedStartRef.current >= 3000) {
        // Eyes closed for 3 seconds
        speakAlert(
          language === 'hi-IN' ? "Neend nahi, padhai karni hai!" : "Wake up! Keep studying!",
          language,
          volume / 100
        );
        eyesClosedStartRef.current = now; // reset
      }
    } else {
      eyesClosedStartRef.current = null;
    }

  }, [isFocused, faceDetected, enabled, language, volume]);
}
