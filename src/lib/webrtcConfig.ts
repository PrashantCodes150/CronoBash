/**
 * WebRTC Configuration Utility
 * Assembles STUN + TURN servers dynamically for production connectivity.
 * Fetches TURN credentials on demand from the server-side API to prevent
 * leaking secret credentials in public client bundles.
 */

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

let cachedIceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS;

/**
 * Synchronous getter for RTCConfiguration.
 * Uses cached servers (defaults to reliable STUN servers until refreshed).
 */
export function getWebRTCConfig(): RTCConfiguration {
  return {
    iceServers: cachedIceServers,
    iceCandidatePoolSize: 10,
  };
}

/**
 * Asynchronously fetches secure ICE/TURN servers from the backend route.
 */
export async function fetchWebRTCConfig(): Promise<RTCConfiguration> {
  try {
    const res = await fetch('/api/webrtc/ice-servers');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        cachedIceServers = data.iceServers;
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote ICE servers, falling back to default STUN:', err);
  }

  return {
    iceServers: cachedIceServers,
    iceCandidatePoolSize: 10,
  };
}

