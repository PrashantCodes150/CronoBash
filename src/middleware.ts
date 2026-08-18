import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Automatically redirect any Vercel preview domain (cronobash-*.vercel.app or cronobash.vercel.app)
  // to the primary domain https://cronobash.com with 308 Permanent Redirect
  if (host.includes('vercel.app')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = 'cronobash.com';
    url.port = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, audio, video
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)).*)',
  ],
};
