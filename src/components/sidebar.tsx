"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { AvatarWithBadge } from './study/AvatarWithBadge';
import { toast } from 'react-hot-toast';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();

  // Hover & Drawer state
  const [isHovered, setIsHovered] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Real Sensors & Workspace Controls State
  const [cameraSensor, setCameraSensor] = useState(true);
  const [voiceCoach, setVoiceCoach] = useState(true);
  const [alarmBeep, setAlarmBeep] = useState(true);
  const [goalShield, setGoalShield] = useState(true);
  const [autoMatchRadar, setAutoMatchRadar] = useState(true);
  const [claymorphicTheme, setClaymorphicTheme] = useState(true);

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Squad Arenas', href: '/rooms', icon: 'groups' },
    { name: 'Live Study', href: '/study', icon: 'timer' },
    { name: 'Task Manager', href: '/tasks', icon: 'checklist' },
    { name: 'Squad Buddies', href: '/buddies', icon: 'person_add' },
    { name: 'Wallet & Stakes', href: '/wallet', icon: 'account_balance_wallet' },
    { name: 'Focus Analytics', href: '/analytics', icon: 'monitoring' },
  ];

  return (
    <div 
      className="relative z-40 shrink-0 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── LEFT VERTICAL ICON RAIL (EXACT STYLING FROM REFERENCE IMAGE) ── */}
      <aside className="w-16 md:w-20 bg-white border border-white/80 rounded-[28px] shadow-sm flex flex-col items-center justify-between py-6 h-[calc(100vh-32px)] sticky top-4">
        
        {/* Top Logo Avatar */}
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md transition-transform hover:scale-110">
          CB
        </Link>

        {/* Navigation Icons */}
        <div className="flex flex-col items-center gap-3 my-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-[#1D1D1F] text-white shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={link.name}
              >
                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                
                {/* Tooltip on hover */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-extrabold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Control Triggers (Settings, Notifications, Avatar) */}
        <div className="flex flex-col items-center gap-3">
          {/* Workspace Controls Trigger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isHovered || isDrawerOpen ? 'bg-blue-50 text-[#3B82F6] border border-blue-200 shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Workspace Controls & Sensors"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* User Profile Avatar with Earned Badge Crest Overlay */}
          <Link href="/profile" title="View Profile & Emblem Medals">
            <AvatarWithBadge
              avatarUrl={profile?.avatar_url || undefined}
              name={profile?.name || 'Fighter'}
              level={profile?.level || 1}
              isVerified={profile?.is_verified}
              size="sm"
            />
          </Link>
        </div>
      </aside>

      {/* ── WORKSPACE CONTROLS & SENSORS DRAWER (EXPANDS ON HOVER OR CLICK) ── */}
      {(isHovered || isDrawerOpen) && (
        <div className="fixed left-24 md:left-28 top-6 w-80 bg-white border border-gray-100 rounded-[28px] shadow-2xl p-6 z-50 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Workspace Sensors</h3>
              <p className="text-[10px] text-slate-400 font-bold">Real-time Telemetry Rig</p>
            </div>
            <span className="material-symbols-outlined text-[#3B82F6] font-bold">tune</span>
          </div>

          <div className="space-y-3">
            
            {/* Sensor 1: AI Camera Gaze */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold">videocam</span>
                </div>
                <span className="text-xs font-bold text-slate-800">MediaPipe Gaze AI</span>
              </div>
              <button
                onClick={() => {
                  setCameraSensor(!cameraSensor);
                  toast.success(cameraSensor ? 'Gaze AI Sensor disabled.' : 'Gaze AI Sensor active!');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  cameraSensor ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${cameraSensor ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Sensor 2: Voice AI Coach */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold">mic</span>
                </div>
                <span className="text-xs font-bold text-slate-800">Voice AI Motivation</span>
              </div>
              <button
                onClick={() => {
                  setVoiceCoach(!voiceCoach);
                  toast.success(voiceCoach ? 'Voice AI Coach muted.' : 'Voice AI Coach unmuted!');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  voiceCoach ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voiceCoach ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Sensor 3: Audio Telemetry Beep */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EAB308] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold">volume_up</span>
                </div>
                <span className="text-xs font-bold text-slate-800">Distraction Alarm</span>
              </div>
              <button
                onClick={() => setAlarmBeep(!alarmBeep)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  alarmBeep ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${alarmBeep ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Sensor 4: Goal Shield */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold">shield</span>
                </div>
                <span className="text-xs font-bold text-slate-800">Daily Streak Shield</span>
              </div>
              <button
                onClick={() => setGoalShield(!goalShield)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  goalShield ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${goalShield ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Sensor 5: Auto-Matchmaking Radar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold">radar</span>
                </div>
                <span className="text-xs font-bold text-slate-800">Auto-Match Radar</span>
              </div>
              <button
                onClick={() => setAutoMatchRadar(!autoMatchRadar)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  autoMatchRadar ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoMatchRadar ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
