"use client";

import React, { useEffect, useState } from 'react';
import { SessionMonitor } from '@/components/admin/SessionMonitor';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Lock } from 'lucide-react';

export default function AdminStatsDebugPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Look up profile role
        const { data: profile, error } = await supabase
          .from('users')
          .select('is_pro, role')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Access role lookup error:", error);
        }

        // Strictly verify admin role from user metadata or profile role
        const isUserAdmin = 
          user.user_metadata?.role === 'admin' ||
          (profile as any)?.role === 'admin' ||
          user.email === 'admin@cronobash.com';

        setIsAdmin(Boolean(isUserAdmin));
      } catch (err) {
        console.error("Access role lookup error:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-400 flex items-center justify-center font-mono text-xs">
        System authorization audit in progress...
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 select-none font-mono">
        <Lock className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-sm font-extrabold uppercase tracking-widest text-red-500 mb-1">Access Restrained</h1>
        <p className="text-[11px] text-neutral-500 text-center max-w-xs leading-relaxed">
          This system console is restricted to administrators and authorized telemetry auditors. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2.5 rounded border border-orange-500/30 text-orange-500">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase font-mono">Telemetry Admin Console</h1>
            <p className="text-[10px] text-neutral-550 font-mono">Monitoring active room sessions and face scanner alerts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded px-3 py-1 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-emerald-400 text-[10px] uppercase font-bold">Live Sync Connected</span>
        </div>
      </div>

      {/* Main dashboard monitor component */}
      <SessionMonitor />
    </div>
  );
}
