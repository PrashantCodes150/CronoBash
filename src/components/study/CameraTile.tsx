"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ShieldAlert } from 'lucide-react';

interface CameraTileProps {
  userId: string;
  name: string;
  stream?: MediaStream;
  isSelf?: boolean;
  isFocused?: boolean;
  isMuted?: boolean;
  distractionCount?: number;
}

export function CameraTile({
  userId,
  name,
  stream,
  isSelf = false,
  isFocused = true,
  isMuted = false,
  distractionCount = 0
}: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showDistractionAlert, setShowDistractionAlert] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.debug("Autoplay blocked or stream connection delay:", err);
      });
    }
  }, [stream, userId]);

  useEffect(() => {
    if (distractionCount > 0) {
      setShowDistractionAlert(true);
      const timer = setTimeout(() => setShowDistractionAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [distractionCount]);

  return (
    <div className="relative w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-lg aspect-square flex flex-col items-center justify-center">
      {/* Distraction Alert Overlay */}
      <AnimatePresence>
        {!isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.2, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-red-950/60 z-10 pointer-events-none border border-red-500/50 rounded-xl"
          />
        )}
      </AnimatePresence>

      {/* Video element */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-neutral-900 flex items-center justify-center">
          <span className="text-[10px] text-neutral-500 font-mono">Camera connecting...</span>
        </div>
      )}

      {/* Name tag and indicators */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-neutral-800 text-white text-xs max-w-[120px] truncate">
          {name} {isSelf ? '(You)' : ''}
        </div>

        <div className="flex items-center gap-1">
          <AnimatePresence>
            {showDistractionAlert && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1 bg-red-950/90 border border-red-800/40 text-red-400 text-[10px] font-mono px-1.5 py-0.5 rounded"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Distraction #{distractionCount}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`w-2.5 h-2.5 rounded-full ${isFocused ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-red-500 shadow-md shadow-red-500/50'}`} />
        </div>
      </div>

      {/* Mic status indicator */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none bg-black/60 backdrop-blur-md p-1.5 rounded border border-neutral-850">
        {isMuted ? (
          <MicOff className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <Mic className="w-3.5 h-3.5 text-emerald-500" />
        )}
      </div>
    </div>
  );
}
