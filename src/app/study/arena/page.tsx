"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudyArenaRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/study');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface">
      <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
      <p className="font-label-mono text-xs mt-4">REDIRECTING TO ARENA RIG...</p>
    </div>
  );
}
