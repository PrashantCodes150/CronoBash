"use client";

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InviteLinkProps {
  inviteCode: string;
}

export default function InviteLink({ inviteCode }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const getJoinUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/rooms?code=${inviteCode}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getJoinUrl());
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-xl space-y-3 w-full max-w-sm">
      <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
        <span>PRIVATE ROOM PASS</span>
        <span className="text-emerald-400 font-bold">INVITE ACTIVE</span>
      </div>

      <div className="flex gap-2">
        <div className="flex-grow bg-black px-3 py-2 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300 select-all truncate">
          {getJoinUrl()}
        </div>

        <button
          onClick={handleCopy}
          className="px-3 py-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white transition-colors"
          title="Copy Invite Link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
        <Share2 className="w-3.5 h-3.5" />
        <span>Share code {inviteCode} with friends to join together.</span>
      </div>
    </div>
  );
}
