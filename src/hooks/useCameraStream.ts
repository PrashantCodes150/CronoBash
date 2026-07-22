"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useCameraStream(
  roomId: string,
  userId: string,
  opponentIds: string[],
  localStream: MediaStream | null
) {
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreamsVersion, setRemoteStreamsVersion] = useState(0);

  useEffect(() => {
    if (!roomId || !userId) return;
    let channel: any;

    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };

    const createPeerConnection = (peerId: string) => {
      // Close existing connection if present to prevent duplicate state
      if (pcsRef.current.has(peerId)) {
        try {
          pcsRef.current.get(peerId)?.close();
        } catch (e) {
          console.error("Error closing existing peer connection:", e);
        }
        pcsRef.current.delete(peerId);
      }

      const pc = new RTCPeerConnection(config);

      // Add local stream tracks if available
      if (localStream) {
        localStream.getTracks().forEach(track => {
          try {
            pc.addTrack(track, localStream);
          } catch (e) {
            console.error("Error adding track to WebRTC:", e);
          }
        });
      }

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          remoteStreamsRef.current.set(peerId, e.streams[0]);
          setRemoteStreamsVersion(v => v + 1);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && channel) {
          channel.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: { from: userId, to: peerId, candidate: e.candidate.toJSON() }
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.warn(`WebRTC connection to ${peerId}: ${pc.connectionState}`);
        }
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    };

    const sendOffer = async (peerId: string) => {
      try {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true
        });
        await pc.setLocalDescription(offer);

        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'camera_offer',
            payload: { from: userId, to: peerId, offer }
          });
        }
      } catch (err) {
        console.error(`Error sending WebRTC offer to ${peerId}:`, err);
      }
    };

    const processQueuedCandidates = async (peerId: string, pc: RTCPeerConnection) => {
      const candidates = iceCandidatesQueueRef.current.get(peerId) || [];
      while (candidates.length > 0) {
        const cand = candidates.shift();
        if (cand) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.error("Error adding queued ICE candidate:", e);
          }
        }
      }
      iceCandidatesQueueRef.current.delete(peerId);
    };

    async function initSignaling() {
      channel = supabase.channel(`room_${roomId}_signaling`, {
        config: { presence: { key: userId } },
      });

      channel
        .on('broadcast', { event: 'peer_ready' }, async ({ payload }: any) => {
          const { from } = payload;
          if (!from || from === userId) return;
          // Send WebRTC offer to newly connected peer
          await sendOffer(from);
        })
        .on('broadcast', { event: 'camera_offer' }, async ({ payload }: any) => {
          const { from, to, offer } = payload;
          if (to !== userId || from === userId) return;

          try {
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processQueuedCandidates(from, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.send({
              type: 'broadcast',
              event: 'camera_answer',
              payload: { from: userId, to: from, answer }
            });
          } catch (err) {
            console.error("Error handling WebRTC camera offer:", err);
          }
        })
        .on('broadcast', { event: 'camera_answer' }, async ({ payload }: any) => {
          const { from, to, answer } = payload;
          if (to !== userId) return;

          const pc = pcsRef.current.get(from);
          if (pc && pc.signalingState !== 'stable') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              await processQueuedCandidates(from, pc);
            } catch (err) {
              console.error("Error handling WebRTC camera answer:", err);
            }
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, async ({ payload }: any) => {
          const { from, to, candidate } = payload;
          if (to !== userId) return;

          const pc = pcsRef.current.get(from);
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding WebRTC ICE candidate:", err);
            }
          } else {
            // Queue candidate until remote description is set
            const currentQueue = iceCandidatesQueueRef.current.get(from) || [];
            currentQueue.push(candidate);
            iceCandidatesQueueRef.current.set(from, currentQueue);
          }
        });

      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence so existing peers send offers
          channel.send({
            type: 'broadcast',
            event: 'peer_ready',
            payload: { from: userId }
          });

          // Send offers to all known opponents
          for (const oppId of opponentIds) {
            if (oppId && oppId !== userId) {
              await sendOffer(oppId);
            }
          }
        }
      });
    }

    initSignaling();

    return () => {
      channel?.unsubscribe();
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      iceCandidatesQueueRef.current.clear();
    };
  }, [roomId, userId, opponentIds.join(','), localStream]);

  return {
    remoteStreams: remoteStreamsRef.current,
    remoteStreamsVersion
  };
}
