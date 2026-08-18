import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = searchParamsGet(requestUrl.searchParams, 'next') || '/dashboard';

  // Determine canonical origin
  let canonicalOrigin = requestUrl.origin;
  if (!canonicalOrigin.includes('localhost') && !canonicalOrigin.includes('127.0.0.1')) {
    canonicalOrigin = 'https://cronobash.com';
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${canonicalOrigin}${next}`);
      }
    } catch (e) {
      console.error('Callback error:', e);
    }
  }

  // Return user to dashboard as fallback
  return NextResponse.redirect(`${canonicalOrigin}/dashboard`);
}

function searchParamsGet(params: URLSearchParams, key: string) {
  return params.get(key);
}
