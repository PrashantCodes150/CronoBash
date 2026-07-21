"use client";

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PrefetchCache {
  room: any;
  allowed: boolean;
  walletBalance: number;
  timestamp: number;
}

const PREFETCH_EXPIRY_MS = 15000; // Cache expires after 15 seconds

export function usePrefetchJoin() {
  const cacheRef = useRef<Record<string, PrefetchCache>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const prefetchRoom = async (roomId: string, userId: string, entryFee: number) => {
    // Check cache validity
    const cached = cacheRef.current[roomId];
    if (cached && Date.now() - cached.timestamp < PREFETCH_EXPIRY_MS) {
      return; // Already cached and fresh
    }

    setLoadingMap(prev => ({ ...prev, [roomId]: true }));

    try {
      // 1. Prefetch room meta
      const roomPromise = supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      // 2. Prefetch wallet balance if money room
      let walletPromise = Promise.resolve({ data: { balance: 0 }, error: null });
      if (entryFee > 0) {
        walletPromise = supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single() as any;
      }

      const [roomRes, walletRes] = await Promise.all([roomPromise, walletPromise]);

      if (!roomRes.error && roomRes.data) {
        const balance = walletRes.data?.balance || 0;
        const allowed = entryFee > 0 ? balance >= entryFee : true;

        cacheRef.current[roomId] = {
          room: roomRes.data,
          allowed,
          walletBalance: balance,
          timestamp: Date.now()
        };
        console.log(`[Prefetch Cache] Preloaded data for room: ${roomId}`);
      }
    } catch (err) {
      console.warn("Prefetch failed:", err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const getPrefetchedData = (roomId: string) => {
    const cached = cacheRef.current[roomId];
    if (cached && Date.now() - cached.timestamp < PREFETCH_EXPIRY_MS) {
      return cached;
    }
    return null;
  };

  return {
    prefetchRoom,
    getPrefetchedData,
    isPrefetching: loadingMap
  };
}
