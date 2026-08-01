"use client";

import { useEffect, useRef, useState } from 'react';

interface UseFramePreloaderOptions {
  enabled?: boolean;
  concurrency?: number;
  priorityCount?: number;
}

export function useFramePreloader(
  frames: string[],
  options: UseFramePreloaderOptions = {}
) {
  const { enabled = true, concurrency = 10, priorityCount = 12 } = options;

  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const framesKey = frames && frames.length > 0 ? `${frames.length}:${frames[0]}:${frames[frames.length - 1]}` : '';

  useEffect(() => {
    if (!frames || frames.length === 0 || !enabled) return;

    let isCancelled = false;
    const total = frames.length;
    const imgArray: HTMLImageElement[] = new Array(total);
    loadedImagesRef.current = imgArray;

    let completed = 0;

    const onSingleImageComplete = (index: number, img: HTMLImageElement) => {
      if (isCancelled) return;
      completed++;
      setLoadedCount(completed);
      if (completed >= total) {
        setIsLoaded(true);
      }
    };

    const loadImage = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isCancelled) return resolve();
        const src = frames[index];
        const img = new Image();
        img.src = src;

        const handleReady = () => {
          imgArray[index] = img;
          onSingleImageComplete(index, img);
          resolve();
        };

        img.onload = handleReady;
        img.onerror = handleReady;

        if ('decode' in img && typeof (img as any).decode === 'function') {
          (img as any).decode().then(handleReady).catch(() => {});
        }
      });
    };

    const loadAll = async () => {
      // Phase 1: High-Priority Initial Frames (0..priorityCount)
      const priorityIndices = Array.from(
        { length: Math.min(priorityCount, total) },
        (_, i) => i
      );
      await Promise.all(priorityIndices.map((idx) => loadImage(idx)));

      if (isCancelled) return;

      // Phase 2: Controlled Concurrency Queue for Remaining Frames
      const remainingIndices = Array.from(
        { length: Math.max(0, total - priorityCount) },
        (_, i) => i + priorityCount
      );

      let poolIndex = 0;
      const worker = async () => {
        while (poolIndex < remainingIndices.length && !isCancelled) {
          const idx = remainingIndices[poolIndex++];
          await loadImage(idx);
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, remainingIndices.length) }, () => worker());
      await Promise.all(workers);
    };

    loadAll();

    return () => {
      isCancelled = true;
    };
  }, [framesKey, enabled, concurrency, priorityCount]);

  const lastValidFrameRef = useRef<HTMLImageElement | null>(null);

  // Helper to get exact frame or hold last valid rendered frame without back-and-forth jumping
  const getFrameOrFallback = (targetIndex: number): HTMLImageElement | null => {
    const images = loadedImagesRef.current;
    if (!images || images.length === 0) return lastValidFrameRef.current;

    const clampedIndex = Math.min(images.length - 1, Math.max(0, targetIndex));
    const targetImg = images[clampedIndex];

    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      lastValidFrameRef.current = targetImg;
      return targetImg;
    }

    // If target frame is still downloading, hold the last successfully rendered frame
    if (lastValidFrameRef.current) {
      return lastValidFrameRef.current;
    }

    // Fallback search backwards only for initial render setup
    for (let i = clampedIndex - 1; i >= 0; i--) {
      if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
        lastValidFrameRef.current = images[i];
        return images[i];
      }
    }

    return null;
  };

  return {
    loadedImagesRef,
    loadedCount,
    isLoaded,
    getFrameOrFallback,
  };
}
