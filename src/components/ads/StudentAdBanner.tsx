"use client";

import React, { useEffect } from 'react';

interface StudentAdBannerProps {
  client?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

/**
 * Reusable Google AdSense & Ethical Student Banner Component
 * Renders live Google AdSense ads when client/slot IDs are provided in env,
 * or displays high-converting internal CronoPass Pro / Referral promos on free tier.
 */
export function StudentAdBanner({
  client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '',
  slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT || '',
  format = 'auto',
  responsive = true,
  className = '',
}: StudentAdBannerProps) {
  useEffect(() => {
    if (client && slot && typeof window !== 'undefined') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense push failed:', err);
      }
    }
  }, [client, slot]);

  // If live Google AdSense client & slot IDs are configured in env, render real Google AdSense unit
  if (client && slot) {
    return (
      <div className={`my-4 overflow-hidden text-center ${className}`}>
        <ins
          className="adsbygoogle block"
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    );
  }

  // Fallback: Internal High-Converting CronoPass Pro Promo Banner for Free Users
  return (
    <div className={`bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl text-left space-y-2 font-mono my-4 relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
          Sponsored Partner
        </span>
        <span className="text-[9px] text-neutral-500">Ad</span>
      </div>

      <h4 className="text-xs font-bold text-white">
        Upgrade to CronoPass Pro &amp; Unlock 2x Streak Multipliers
      </h4>
      <p className="text-[11px] text-neutral-400 leading-relaxed">
        Study ad-free, get HD video streams, and access unlimited AI Coach schedule optimization.
      </p>

      <a
        href="/wallet"
        className="inline-block text-[11px] text-emerald-400 hover:text-white font-bold underline pt-1"
      >
        Learn More &rarr;
      </a>
    </div>
  );
}
