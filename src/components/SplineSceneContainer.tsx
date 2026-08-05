"use client";

import React, { Suspense, lazy, useState } from 'react';

// Lazy load @splinetool/react-spline to keep initial bundle light
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneContainerProps {
  scene: string;
  className?: string;
  fallbackImage?: string;
  onLoad?: (splineApp: any) => void;
  onMouseDown?: (e: any) => void;
  onMouseOver?: (e: any) => void;
  style?: React.CSSProperties;
}

export default function SplineSceneContainer({
  scene,
  className = '',
  fallbackImage,
  onLoad,
  onMouseDown,
  onMouseOver,
  style,
}: SplineSceneContainerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (splineApp: any) => {
    setIsLoaded(true);
    if (onLoad) onLoad(splineApp);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError && fallbackImage) {
    return (
      <div className={`relative w-full h-full ${className}`} style={style}>
        <img
          src={fallbackImage}
          alt="3D Scene Visual"
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden ${className}`} style={style}>
      {/* Loading Skeleton Spinner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md rounded-3xl">
          <div className="w-10 h-10 border-3 border-amber-500/20 border-t-[#FF5500] rounded-full animate-spin mb-3" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading 3D Scene...
          </span>
        </div>
      )}

      {/* Spline 3D Scene Canvas */}
      {!hasError && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20" />
          }
        >
          <Spline
            scene={scene}
            onLoad={handleLoad}
            onError={handleError}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
            className={`w-full h-full transition-opacity duration-700 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Suspense>
      )}
    </div>
  );
}
