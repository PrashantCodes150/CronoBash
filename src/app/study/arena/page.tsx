"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import LogoLoader from '@/components/LogoLoader';

export default function StudyArenaRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/study');
  }, [router]);

  return <LogoLoader size="full" text="REDIRECTING TO ARENA RIG..." />;
}
