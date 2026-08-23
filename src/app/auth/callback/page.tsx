"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import LogoLoader from '@/components/LogoLoader';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        if (error || errorDesc) {
          const fullError = errorDesc || error || 'Authentication failed';
          let friendlyMsg = fullError;
          if (fullError.toLowerCase().includes('provider is not enabled') || fullError.toLowerCase().includes('unsupported provider')) {
            friendlyMsg = 'Google Provider is not enabled in your Supabase Dashboard. Please go to Authentication -> Providers -> Google and turn it ON with your Google Client ID & Secret.';
          }
          setErrorMsg(friendlyMsg);
          setTimeout(() => router.replace('/login'), 4000);
          return;
        }

        const code = searchParams.get('code');

        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error('OAuth code exchange error:', exchangeErr);
            setErrorMsg(exchangeErr.message || 'Failed to exchange authorization code for a session.');
            setTimeout(() => router.replace('/login'), 3000);
            return;
          }
          router.replace('/dashboard');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (e: any) {
        console.error('Callback exception:', e);
        setErrorMsg(e?.message || 'Unexpected authentication callback error.');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center max-w-md border border-red-200">
          <p className="font-semibold text-lg mb-1">Authentication Warning</p>
          <p className="text-sm opacity-90">{errorMsg}</p>
          <p className="text-xs text-slate-500 mt-3">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
      <LogoLoader size="md" text="COMPLETING SECURE SIGN IN..." />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
        <LogoLoader size="md" text="COMPLETING SECURE SIGN IN..." />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
