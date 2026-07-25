"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/terms#privacy');
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-mono p-12 flex flex-col items-center justify-center space-y-3">
      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider animate-pulse">
        Redirecting to Privacy Policy &amp; Data Protection Disclaimers...
      </p>
    </div>
  );
}
