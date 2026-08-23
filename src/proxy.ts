import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicit Security Firewall: Block direct access to database files, env, internal docs & scripts
  const lowerPath = pathname.toLowerCase();
  if (
    lowerPath.startsWith('/supabase') ||
    lowerPath.includes('migration') ||
    lowerPath.endsWith('.sql') ||
    lowerPath.endsWith('.md') ||
    lowerPath.endsWith('.py') ||
    lowerPath.endsWith('.sh') ||
    lowerPath.endsWith('.config.js') ||
    lowerPath.endsWith('.config.mjs') ||
    lowerPath.endsWith('.config.ts') ||
    lowerPath.includes('.env') ||
    lowerPath.startsWith('/.git') ||
    lowerPath.startsWith('/.agents') ||
    lowerPath.startsWith('/.vscode') ||
    lowerPath.startsWith('/scripts') ||
    lowerPath.startsWith('/tests') ||
    lowerPath.includes('biggyplan') ||
    lowerPath.includes('billion_future')
  ) {
    return new NextResponse('Access Forbidden: Security Policy Enforced.', { status: 403 });
  }

  // 2. List of public routes accessible without login
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/refund' ||
    pathname === '/legal' ||
    pathname.startsWith('/auth');

  // Allow static files, api routes, media files, and Next.js internal assets
  const isStaticOrApi =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/squad-frames') ||
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
