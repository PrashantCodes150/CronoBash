"use client";

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseOptimisticLeaveProps {
  roomId: string;
  userId: string;
  onOptimisticLeave: () => void;
}

export function useOptimisticLeave({ roomId, userId, onOptimisticLeave }: UseOptimisticLeaveProps) {
  
  const executeLeave = useCallback(async () => {
    // 1. Immediately update UI local state (Optimistic)
    onOptimisticLeave();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 2. Call Edge Function (or database RPC) in background
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/leave_room`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, roomId })
      });
    } catch (e) {
      console.warn("Async leave function failed, trying database fallback...", e);
      // Fallback: direct database deletion
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
    }
  }, [roomId, userId, onOptimisticLeave]);

  // Window unload/tab close backup beacon
  useEffect(() => {
    const handleBeforeUnload = () => {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/leave_room`;
      const payload = JSON.stringify({ userId, roomId });
      
      // Use sendBeacon to guarantee delivery when tab is closed abruptly
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, payload);
      } else {
        // Fallback for browsers that don't support sendBeacon
        fetch(url, {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, userId]);

  return { executeLeave };
}
