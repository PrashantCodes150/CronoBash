/**
 * WebRTC Configuration Utility
 * Assembles STUN + TURN servers dynamically for production connectivity.
 * Supports Jio/Airtel CGNAT & college/hostel Wi-Fi NAT environments.
 */

export function getWebRTCConfig(): RTCConfiguration {
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const iceServers: RTCIceServer[] = [
    // Standard STUN servers (Primary resolution)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];

  // If production TURN server credentials are provided in env, add TURN relays
  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push(
      {
        urls: turnUrl.startsWith('turn:') ? turnUrl : `turn:${turnUrl}`,
        username: turnUsername,
        credential: turnCredential,
      },
      {
        urls: turnUrl.startsWith('turns:') ? turnUrl : `turns:${turnUrl}`,
        username: turnUsername,
        credential: turnCredential,
      }
    );
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
}
