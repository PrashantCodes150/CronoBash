import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of public routes accessible without login
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/refund' ||
    pathname === '/legal';

  // Allow static files, api routes, media files, and Next.js internal assets
  const isStaticOrApi =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/hero-frames') ||
    pathname.startsWith('/mastery-frames') ||
    pathname.startsWith('/workflow-frames') ||
    pathname.startsWith('/momentum-frames') ||
    pathname.startsWith('/momentum-loop-frames') ||
    pathname.startsWith('/scroll-frames') ||
    pathname.startsWith('/auth-frames') ||
    pathname.startsWith('/frames') ||
    pathname.startsWith('/backgrounds') ||
    pathname.endsWith('.mp4') ||
    pathname.endsWith('.webm') ||
    pathname.endsWith('.ogv') ||
    pathname.endsWith('.mp3') ||
    pathname.endsWith('.wav') ||
    pathname.endsWith('.ogg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js');

  if (isStaticOrApi) {
    return NextResponse.next();
  }

  // Pass through to client-side AuthContext for seamless session management
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
