import { NextRequest, NextResponse } from 'next/server';

/**
 * WebRTC ICE Servers Endpoint
 * Securely delivers STUN and TURN server credentials from server environment
 * without exposing static credentials in client-side bundles (NEXT_PUBLIC_).
 */
export async function GET(req: NextRequest) {
  try {
    const turnUrl = process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];

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

    return NextResponse.json(
      { iceServers },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        error: error.message,
      },
      { status: 500 }
    );
  }
}
