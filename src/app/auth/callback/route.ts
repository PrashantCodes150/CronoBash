import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = searchParamsGet(requestUrl.searchParams, 'next');

  // Determine canonical origin
  let canonicalOrigin = requestUrl.origin;
  if (!canonicalOrigin.includes('localhost') && !canonicalOrigin.includes('127.0.0.1')) {
    canonicalOrigin = 'https://cronobash.com';
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // If an explicit non-dashboard target was requested, use it; otherwise land on '/' so auth-context can route appropriately
        const destination = (nextParam && nextParam !== '/dashboard') ? nextParam : '/';
        return NextResponse.redirect(`${canonicalOrigin}${destination}`);
      }
    } catch (e) {
      console.error('Callback error:', e);
    }
  }

  // Return user to login as fallback
  return NextResponse.redirect(`${canonicalOrigin}/login`);
}

function searchParamsGet(params: URLSearchParams, key: string) {
  return params.get(key);
}
