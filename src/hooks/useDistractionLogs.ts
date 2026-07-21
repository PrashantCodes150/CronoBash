"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface DistractionLog {
  id: string;
  room_id: string;
  user_id: string;
  type: 'hand-down' | 'gaze-away' | 'eye-closed' | 'face-absent' | 'static-frame';
  duration_sec: number;
  created_at: string;
}

export function useDistractionLogs(roomId: string, userId: string) {
  const [logs, setLogs] = useState<DistractionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !userId) return;

    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('distraction_logs')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching distraction logs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();

    // Subscribe to real-time logs inserted for this user and room
    const channel = supabase
      .channel(`distraction_logs_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'distraction_logs',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newLog = payload.new as DistractionLog;
          if (newLog.user_id === userId) {
            setLogs((prev) => [...prev, newLog]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, userId]);

  return { logs, loading };
}
