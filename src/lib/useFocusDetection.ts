"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseFocusDetectionResult {
  isFocused: boolean;
  faceDetected: boolean;
  eyeOpen: boolean;
  facingScreen: boolean;
  modelLoaded: boolean;
  modelError: string | null;
}

interface UseFocusDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  detectionInterval?: number;
}

const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const FOREHEAD = 10;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function eyeAspectRatio(
  landmarks: { x: number; y: number }[],
  topIdx: number,
  bottomIdx: number,
  innerIdx: number,
  outerIdx: number
): number {
  const top = landmarks[topIdx];
  const bottom = landmarks[bottomIdx];
  const inner = landmarks[innerIdx];
  const outer = landmarks[outerIdx];
  const verticalDist = distance(top, bottom);
  const horizontalDist = distance(inner, outer);
  return horizontalDist === 0 ? 0 : verticalDist / horizontalDist;
}

export function useFocusDetection({
  videoRef,
  enabled,
  detectionInterval = 1000,
}: UseFocusDetectionOptions): UseFocusDetectionResult {
  const [isFocused, setIsFocused] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [eyeOpen, setEyeOpen] = useState(false);
  const [facingScreen, setFacingScreen] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const faceLandmarkerRef = useRef<{ detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: { x: number; y: number }[][] }; close: () => void } | null>(null);
  const detectionLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameTimeRef = useRef<number>(-1);
  const lastResultRef = useRef({ eyeOpen: true, facingScreen: true });
  const consecutiveNoFaceRef = useRef(0);

  const loadModel = useCallback(async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      let faceLandmarker;
      try {
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });
      } catch {
        // GPU delegate failed, fall back to CPU
        console.warn("GPU delegate unavailable, falling back to CPU");
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });
      }

      faceLandmarkerRef.current = faceLandmarker;
      setModelLoaded(true);
      setModelError(null);
    } catch (err: unknown) {
      console.error("Failed to load face detection model:", err);
      setModelError(err instanceof Error ? err.message : "Model load failed");
    }
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    if (!video || !faceLandmarker || video.readyState < 2) return;

    const now = performance.now();
    if (now - lastFrameTimeRef.current < 100) return;
    lastFrameTimeRef.current = now;

    try {
      const results = faceLandmarker.detectForVideo(video, now);

      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        consecutiveNoFaceRef.current++;
        if (consecutiveNoFaceRef.current >= 3) {
          setFaceDetected(false);
          setIsFocused(false);
          setEyeOpen(false);
          setFacingScreen(false);
        }
        return;
      }

      consecutiveNoFaceRef.current = 0;
      setFaceDetected(true);
      const landmarks = results.faceLandmarks[0];

      const leftEAR = eyeAspectRatio(landmarks, LEFT_EYE_TOP, LEFT_EYE_BOTTOM, LEFT_EYE_INNER, LEFT_EYE_OUTER);
      const rightEAR = eyeAspectRatio(landmarks, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM, RIGHT_EYE_INNER, RIGHT_EYE_OUTER);
      const avgEAR = (leftEAR + rightEAR) / 2;
      const eyesOpen = avgEAR > 0.18;

      const nose = landmarks[NOSE_TIP];
      const chin = landmarks[CHIN];
      const leftCheek = landmarks[LEFT_CHEEK];
      const rightCheek = landmarks[RIGHT_CHEEK];
      const forehead = landmarks[FOREHEAD];

      const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
      const noseOffsetFromCenter = Math.abs(nose.x - faceCenterX);
      const faceWidth = distance(leftCheek, rightCheek);
      const horizontalRatio = faceWidth === 0 ? 0 : noseOffsetFromCenter / faceWidth;

      const noseToChin = distance(nose, chin);
      const foreheadToNose = distance(forehead, nose);
      const verticalRatio = foreheadToNose === 0 ? 1 : noseToChin / foreheadToNose;

      const facing = horizontalRatio < 0.35 && verticalRatio > 0.3 && verticalRatio < 1.5;

      setEyeOpen(eyesOpen);
      setFacingScreen(facing);
      setIsFocused(eyesOpen && facing);

      lastResultRef.current = { eyeOpen: eyesOpen, facingScreen: facing };
    } catch {
      // Detection failed on this frame, keep previous state
    }
  }, [videoRef]);

  useEffect(() => {
    if (enabled && !faceLandmarkerRef.current) {
      loadModel();
    }
  }, [enabled, loadModel]);

  useEffect(() => {
    if (enabled && modelLoaded) {
      detectionLoopRef.current = setInterval(detect, detectionInterval);
    }
    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
    };
  }, [enabled, modelLoaded, detectionInterval, detect]);

  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  return { isFocused, faceDetected, eyeOpen, facingScreen, modelLoaded, modelError };
}
