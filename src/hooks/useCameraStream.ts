"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCameraStream(roomId: string, userId: string, opponentIds: string[], localStream: MediaStream | null) {
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreamsVersion, setRemoteStreamsVersion] = useState(0); // Trigger React re-render

  useEffect(() => {
    if (!roomId || !userId) return;
    let channel: any;

    async function init() {
      const config = {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      };

      // Set up Supabase Realtime signaling channel
      channel = supabase.channel(`room_${roomId}_signaling`, {
        config: { presence: { key: userId } },
      });

      channel.on('broadcast', { event: 'camera_offer' }, async ({ payload }: any) => {
        const { from, to, offer } = payload;
        if (from === userId || to !== userId) return;

        const pc = new RTCPeerConnection(config);
        
        // Add local tracks to send to opponent
        if (localStream) {
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        pc.ontrack = (e) => {
          if (e.streams && e.streams[0]) {
            remoteStreamsRef.current.set(from, e.streams[0]);
            setRemoteStreamsVersion((v) => v + 1);
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: { from: userId, to: from, candidate: e.candidate }
            });
          }
        };

        pcsRef.current.set(from, pc);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: 'broadcast',
          event: 'camera_answer',
          payload: { from: userId, to: from, answer }
        });
      });

      channel.on('broadcast', { event: 'camera_answer' }, async ({ payload }: any) => {
        const { from, to, answer } = payload;
        if (to !== userId) return;

        const pc = pcsRef.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      channel.on('broadcast', { event: 'ice_candidate' }, async ({ payload }: any) => {
        const { from, to, candidate } = payload;
        if (to !== userId) return;

        const pc = pcsRef.current.get(from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding WebRTC candidate:", err);
          }
        }
      });

      await channel.subscribe();

      // Create peer connection offers to all currently connected opponents
      for (const oppId of opponentIds) {
        if (oppId === userId) continue;

        const pc = new RTCPeerConnection(config);

        if (localStream) {
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        pc.ontrack = (e) => {
          if (e.streams && e.streams[0]) {
            remoteStreamsRef.current.set(oppId, e.streams[0]);
            setRemoteStreamsVersion((v) => v + 1);
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: { from: userId, to: oppId, candidate: e.candidate }
            });
          }
        };

        pcsRef.current.set(oppId, pc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        channel.send({
          type: 'broadcast',
          event: 'camera_offer',
          payload: { from: userId, to: oppId, offer }
        });
      }
    }

    init();

    return () => {
      channel?.unsubscribe();
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
    };
  }, [roomId, userId, opponentIds.join(','), localStream]);

  return {
    remoteStreams: remoteStreamsRef.current,
    remoteStreamsVersion
  };
}
