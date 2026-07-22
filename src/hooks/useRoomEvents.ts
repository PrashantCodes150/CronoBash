"use client";

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, RoomMember } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface UseRoomEventsProps {
  roomId: string;
  userId: string;
  userName: string;
  isSpectator?: boolean;
  onSessionEnded?: () => void;
  onMatchForfeited?: (forfeitingUserId: string) => void;
  onOpponentDistracted?: (opponentId: string, distractionCount: number) => void;
}

export interface SyncMember extends RoomMember {
  isFocused: boolean;
  isMuted: boolean;
  distractionCount: number;
  isSpectator: boolean;
  latestEmote?: { code: string; id: string } | null;
  isFakeCam?: boolean;
}

export function useRoomEvents({
  roomId,
  userId,
  userName,
  isSpectator = false,
  onSessionEnded,
  onMatchForfeited,
  onOpponentDistracted
}: UseRoomEventsProps) {
  const [members, setMembers] = useState<SyncMember[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Debouncing locks
  const lastStateSentRef = useRef<{ isFocused: boolean; distractionCount: number }>({ isFocused: true, distractionCount: 0 });
  const lastFocusAlertTime = useRef<Record<string, number>>({});

  const updateMemberState = (uId: string, updates: Partial<SyncMember>) => {
    setMembers(prev => prev.map(member => {
      if (member.user_id === uId) {
        return { ...member, ...updates };
      }
      return member;
    }));
  };

  const sendEmote = (emoteCode: string) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'emote_event',
      payload: { userId, emoteCode, id: Math.random().toString(36).substring(2, 9) }
    });
  };

  const broadcastFocusState = (isFocused: boolean, distractionCount: number, isFakeCam = false) => {
    if (!channelRef.current || isSpectator) return;
    
    // Prevent duplicated redundant status updates
    const last = lastStateSentRef.current;
    if (last.isFocused === isFocused && last.distractionCount === distractionCount) {
      return;
    }
    lastStateSentRef.current = { isFocused, distractionCount };

    channelRef.current.send({
      type: 'broadcast',
      event: 'focus_state_event',
      payload: { userId, isFocused, distractionCount, isFakeCam }
    });

    // Log to sync_logs table in Supabase
    supabase.from('sync_logs').insert({
      room_id: roomId,
      user_id: userId,
      event_type: isFocused ? 'focus' : 'distraction',
      payload: { isFocused, distractionCount, isFakeCam }
    }).then(({ error }) => {
      if (error && error.code !== 'PGRST116') {
        console.debug("sync_logs write error: ", error.message);
      }
    });
  };

  const broadcastMuteState = (isMuted: boolean) => {
    if (!channelRef.current || isSpectator) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'mute_state_event',
      payload: { userId, isMuted }
    });
  };

  useEffect(() => {
    if (!roomId || !userId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select('*, users:user_id(name, avatar_url)')
        .eq('room_id', roomId);
      
      if (!error && data) {
        const synced = data.map((item: any) => ({
          ...item,
          isFocused: true,
          isMuted: false,
          distractionCount: 0,
          isSpectator: false,
          isFakeCam: false
        }));
        setMembers(synced);
      }
    };
    fetchMembers();

    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        
        activeIds.forEach(uId => {
          const presenceList = state[uId] as any[];
          const presenceData = presenceList[0];
          if (presenceData) {
            setMembers(prev => {
              const exists = prev.some(m => m.user_id === uId);
              if (!exists) {
                return [...prev, {
                  id: Math.random().toString(),
                  room_id: roomId,
                  user_id: uId,
                  joined_at: new Date().toISOString(),
                  total_focus_seconds_today: 0,
                  users: {
                    id: uId,
                    name: presenceData.name,
                    email: '',
                    avatar_url: presenceData.avatarUrl || null,
                    daily_goal_minutes: 120,
                    created_at: new Date().toISOString()
                  },
                  isFocused: true,
                  isMuted: false,
                  distractionCount: 0,
                  isSpectator: !!presenceData.isSpectator,
                  isFakeCam: false
                }];
              }
              return prev;
            });
          }
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presenceData = newPresences[0] as any;
        if (presenceData && key !== userId) {
          toast.success(`${presenceData.name} joined the study room`);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presenceData = leftPresences[0] as any;
        if (presenceData && key !== userId) {
          toast(`${presenceData.name} has left the study room`, { icon: '🚪' });
          setMembers(prev => prev.filter(m => m.user_id !== key));
        }
      })
      .on('broadcast', { event: 'focus_state_event' }, ({ payload }) => {
        const { userId: senderId, isFocused, distractionCount, isFakeCam } = payload;
        
        const now = Date.now();
        const lastAlert = lastFocusAlertTime.current[senderId] || 0;
        if (!isFocused && now - lastAlert < 3000) {
          return;
        }
        if (!isFocused) {
          lastFocusAlertTime.current[senderId] = now;
        }

        updateMemberState(senderId, { isFocused, distractionCount, isFakeCam });
        
        if (!isFocused && senderId !== userId && onOpponentDistracted) {
          onOpponentDistracted(senderId, distractionCount);
        }
      })
      .on('broadcast', { event: 'mute_state_event' }, ({ payload }) => {
        const { userId: senderId, isMuted } = payload;
        updateMemberState(senderId, { isMuted });
      })
      .on('broadcast', { event: 'emote_event' }, ({ payload }) => {
        const { userId: senderId, emoteCode, id } = payload;
        updateMemberState(senderId, { latestEmote: { code: emoteCode, id } });
      })
      .on('broadcast', { event: 'session_ended_event' }, () => {
        if (onSessionEnded) onSessionEnded();
      })
      .on('broadcast', { event: 'match_forfeited_event' }, ({ payload }) => {
        const { forfeitingUserId } = payload || {};
        if (onMatchForfeited) onMatchForfeited(forfeitingUserId);
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          name: userName,
          isSpectator,
          joinedAt: new Date().toISOString()
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId, userName, isSpectator]);

  const endSessionBroadcast = () => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'session_ended_event',
      payload: {}
    });
  };

  const forfeitMatchBroadcast = (forfeitingUserId: string) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'match_forfeited_event',
      payload: { forfeitingUserId }
    });
  };

  return {
    members,
    sendEmote,
    broadcastFocusState,
    broadcastMuteState,
    endSessionBroadcast,
    forfeitMatchBroadcast
  };
}
