"use client";

import React, { useEffect, useState } from 'react';
import { Sun, AlertTriangle } from 'lucide-react';

interface LightingWarningBannerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function LightingWarningBanner({ videoRef }: LightingWarningBannerProps) {
  const [lowLight, setLowLight] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const interval = setInterval(() => {
      if (!videoRef?.current || videoRef.current.paused || videoRef.current.ended) return;

      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = 64;
      canvas.height = 48;

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Calculate perceptual luminance: Y = 0.299R + 0.587G + 0.114B
          const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / (data.length / 4);
        setLowLight(avgBrightness < 35); // Brightness threshold
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [videoRef]);

  if (!lowLight) return null;

  return (
    <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-3 shadow-lg animate-pulse">
      <div className="flex items-center gap-2">
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-200 uppercase font-bold">Low Room Lighting:</strong> Turn on a desk lamp for optimal eye-tracking accuracy.
        </span>
      </div>
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
    </div>
  );
}
