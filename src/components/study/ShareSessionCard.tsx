"use client";

import React from 'react';
import { Twitter, MessageSquareShare, Share2 } from 'lucide-react';

interface ShareSessionCardProps {
  durationMinutes: number;
  focusScore: number;
}

export function ShareSessionCard({ durationMinutes, focusScore }: ShareSessionCardProps) {
  const shareText = `I just focused for ${durationMinutes} minutes and scored ${focusScore} points in CogniSweep Focus Arena! Join my study room: ${window.location.origin}`;

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white font-mono flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2 text-orange-500">
        <Share2 className="w-4 h-4" />
        <span className="text-xs font-extrabold uppercase tracking-wide">Share Performance</span>
      </div>

      <div className="flex gap-2.5 mt-3">
        <button 
          onClick={shareTwitter}
          className="flex-1 bg-[#1da1f2] hover:bg-[#1a91da] text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
        >
          <Twitter className="w-4 h-4 fill-white" />
          <span>Twitter</span>
        </button>

        <button 
          onClick={shareWhatsApp}
          className="flex-1 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
        >
          <MessageSquareShare className="w-4 h-4 fill-white" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
