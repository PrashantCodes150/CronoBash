"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabaseClient';
import { BADGES } from '@/lib/badges';
import confetti from 'canvas-confetti';
import { VerifiedBadge } from '@/components/study/VerifiedBadge';
import { BadgeDisplay } from '@/components/study/BadgeDisplay';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

// Interactive Swipeable Notification Item Component (Touch & Mouse Drag)
const NotificationItem = ({ 
  n, 
  onDelete, 
  onAcceptBuddy, 
  onDeclineBuddy, 
  onJoinLobby 
}: { 
  n: AppNotification; 
  onDelete: (id: string) => void;
  onAcceptBuddy: (nid: string, cid: string) => void;
  onDeclineBuddy: (nid: string, cid: string) => void;
  onJoinLobby: (nid: string, meta: any) => void;
}) => {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsSwiping(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startX.current;
    setDragX(delta);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (Math.abs(dragX) > 75) {
      onDelete(n.id);
    } else {
      setDragX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/20">
      <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-red-600 pointer-events-none">
        <span>Delete 🗑️</span>
        <span>Delete 🗑️</span>
      </div>

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        style={{ transform: `translateX(${dragX}px)`, transition: isSwiping ? 'none' : 'transform 0.2s ease-out' }}
        className={`p-3 rounded-xl border text-xs text-left relative z-10 select-none cursor-grab active:cursor-grabbing ${
          n.is_read 
            ? 'bg-slate-50 border-slate-200 text-slate-500'
            : 'bg-white border-blue-200 shadow-xs text-slate-800'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <span className={`font-bold text-[10px] ${
            n.type === 'transaction' ? 'text-emerald-600' : n.type === 'achievement' ? 'text-amber-600' : 'text-[#3B82F6]'
          }`}>
            {n.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {!n.is_read && (
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
              title="Delete notification"
              className="text-slate-400 hover:text-red-500 font-extrabold text-sm leading-none p-0.5 hover:bg-slate-100 rounded cursor-pointer transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        <p className="mt-1 leading-normal break-words">{n.message}</p>

        {n.type === 'buddy_request' && n.metadata?.connection_id && !n.is_read && (
          <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#E5E5E3]">
            <button
              onClick={() => onAcceptBuddy(n.id, n.metadata.connection_id)}
              className="bg-[#E6F4EA] hover:bg-[#E6F4EA]/80 text-[#137333] font-bold text-[8px] uppercase px-2 py-1 rounded border border-[#137333]/30 cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={() => onDeclineBuddy(n.id, n.metadata.connection_id)}
              className="bg-[#FCE8E6] hover:bg-[#FCE8E6]/80 text-[#C5221F] font-bold text-[8px] uppercase px-2 py-1 rounded border border-[#C5221F]/30 cursor-pointer"
            >
              Decline
            </button>
          </div>
        )}

        {n.type === 'invite' && (n.metadata?.invite_code || n.metadata?.room_id) && !n.is_read && (
          <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#E5E5E3]">
            <button
              onClick={() => onJoinLobby(n.id, n.metadata)}
              className="bg-[#FF5A1F] text-white font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg border border-[#FF5A1F] hover:bg-[#E04D14] cursor-pointer flex items-center gap-1"
            >
              ⚔️ Join Arena Room
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100/60 text-[8px] text-[#70706F] font-mono">
          <span className="text-[7px] text-slate-400">↔ Swipe left/right to clear</span>
          <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, wallet, signOut, refreshWallet, refreshProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.warn("Notifications query note:", error.message);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (data) {
        const cleanData = data.filter(n => n.title !== 'Transaction Posted');
        setNotifications(cleanData);
        setUnreadCount(cleanData.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount(uc => Math.max(0, uc - 1));
      }
      return prev.filter(n => n.id !== id);
    });
    if (user) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (e) {
        console.error('Error deleting notification:', e);
      }
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
    if (user) {
      try {
        await supabase.from('notifications').delete().eq('user_id', user.id);
      } catch (e) {
        console.error('Error clearing all notifications:', e);
      }
    }
  };

  const handleAcceptBuddyRequest = async (notificationId: string, connectionId: string) => {
    try {
      const { error: connError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);
      if (connError) throw connError;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      alert("Buddy request accepted!");
      if (typeof window !== 'undefined') window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to accept buddy request.");
    }
  };

  const handleDeclineBuddyRequest = async (notificationId: string, connectionId: string) => {
    try {
      const { error: connError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);
      if (connError) throw connError;

      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      alert("Buddy request declined.");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to decline buddy request.");
    }
  };

  const handleJoinLobby = async (notificationId: string, metadata: any) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotificationsOpen(false);

      if (metadata?.room_id) {
        router.push(`/rooms/${metadata.room_id}`);
      } else if (metadata?.invite_code) {
        router.push(`/rooms?code=${metadata.invite_code}`);
      } else {
        router.push('/rooms');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const notificationsChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  // Hidden on root landing and auth pages for layout simplicity
  const authRoutes = ['/', '/login', '/signup', '/onboarding'];
  if (authRoutes.includes(pathname)) return null;

  return (
    <header className="sticky top-4 z-40 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-8 mb-4 sm:mb-6">
      <div className="bg-white/50 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] rounded-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3.5 flex items-center justify-between" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)' }}>
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer select-none no-underline">
            <img
              src="/cronobash-icon.webp"
              alt="CronoBash Emblem"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#334155]" style={{ fontFamily: "'Syne', sans-serif" }}>
              CronoBash
            </span>
          </Link>
        </div>

        {/* Desktop Quick Nav Links */}
        <div className="hidden lg:flex items-center gap-1 bg-white/40 backdrop-blur-xl p-1 rounded-full border border-white/30 shadow-[0_4px_16px_0_rgba(0,0,0,0.06)] text-xs font-bold text-[#44474c]">
          {[
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Focus Sprints', href: '/study' },
            { name: 'Squad Arenas', href: '/rooms' },
          ].map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-full transition-all ${
                  active ? 'bg-[#334155] text-white shadow-sm' : 'hover:text-[#334155] hover:bg-white/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Navigation Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#3B82F6] hover:bg-slate-100 transition-all cursor-pointer select-none"
              title="Navigation Menu"
            >
              <span className="material-symbols-outlined text-[22px]">more_vert</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 top-full pt-2 z-50">
                  <div className="w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-2 font-mono text-[9px] text-slate-400 uppercase tracking-widest font-black text-left">
                      Arena Navigation
                    </div>
                    <ul className="space-y-1 font-label-mono text-xs uppercase font-bold text-[#70706F] text-left">
                      {[
                        { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
                        { name: 'Buddies', href: '/buddies', icon: 'person_add' },
                        { name: 'Arenas', href: '/rooms', icon: 'groups' },
                        { name: 'Tasks', href: '/tasks', icon: 'checklist' },
                        { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
                        { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
                        { name: 'Store', href: '/marketplace', icon: 'storefront' },
                        { name: 'Profile', href: '/profile', icon: 'person' },
                        { name: 'Settings', href: '/settings', icon: 'settings' }
                      ].map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <li key={link.name}>
                            <Link
                              href={link.href}
                              onClick={() => setMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'text-white bg-[#3B82F6] font-bold'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">{link.icon}</span>
                              <span>{link.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="text-[#70706F] hover:text-[#FF5A1F] transition-colors relative cursor-pointer focus:outline-none p-1.5 rounded-lg hover:bg-[#F4F4F3] group"
            >
              <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">notifications</span>
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping"></span>
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5A1F]"></span>
                </>
              )}
            </button>

            {notificationsOpen && (
              <>
                {/* Click outside to close */}
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                
                <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] max-w-xs sm:w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                      <span>Notifications</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[#3B82F6] hover:underline text-[9px] uppercase font-bold cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="text-red-500 hover:underline text-[9px] uppercase font-bold cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">notifications_off</span>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <NotificationItem
                          key={n.id}
                          n={n}
                          onDelete={deleteNotification}
                          onAcceptBuddy={handleAcceptBuddyRequest}
                          onDeclineBuddy={handleDeclineBuddyRequest}
                          onJoinLobby={handleJoinLobby}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dedicated Active Emblem Badge Button with Hover Popover */}
          <div className="relative group/navbadge">
            <Link
              href="/profile"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:scale-105 transition-transform shrink-0 p-1 shadow-xs"
            >
              <BadgeDisplay
                badge={BADGES[Math.max(0, Math.min((profile?.level || 1) - 1, BADGES.length - 1))] || BADGES[0]}
                isUnlocked={true}
                size="sm"
              />
            </Link>

            {/* Hover Details Card Popover */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] rounded-2xl p-4 opacity-0 group-hover/navbadge:opacity-100 transition-opacity pointer-events-none z-50 space-y-2" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 100%)' }}>
              <div className="flex items-center gap-3">
                <BadgeDisplay
                  badge={BADGES[Math.max(0, Math.min((profile?.level || 1) - 1, BADGES.length - 1))] || BADGES[0]}
                  isUnlocked={true}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {(BADGES[Math.max(0, Math.min((profile?.level || 1) - 1, BADGES.length - 1))] || BADGES[0]).name}
                  </p>
                  <span className="text-[9px] font-extrabold bg-amber-50 text-[#F59E0B] px-2 py-0.5 rounded-md uppercase">
                    Level {(profile?.level || 1)} Badge Unlocked ✓
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                {(BADGES[Math.max(0, Math.min((profile?.level || 1) - 1, BADGES.length - 1))] || BADGES[0]).description}
              </p>
            </div>
          </div>

          {/* User profile picture with dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 border border-slate-300 shrink-0 cursor-pointer focus:outline-none hover:scale-105 transition-transform overflow-hidden shadow-xs"
              title="View User Profile"
            >
              <img
                alt="User profile"
                className="w-full h-full object-cover rounded-full"
                src={profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight'}
              />
            </button>

            {dropdownOpen && (
              <>
                {/* Click outside overlay to close */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 truncate">{profile?.name || 'Arena Fighter'}</span>
                      <VerifiedBadge level={profile?.level || 1} followersCount={profile?.followers_count || 0} isVerified={profile?.is_verified} size="sm" showLevelNumber={true} />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile?.email}</p>
                  </div>
                  <ul className="py-1 text-xs font-semibold text-slate-600 space-y-0.5">
                    <li>
                      <Link 
                        href="/profile" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-slate-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">person</span>
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-slate-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-600 text-left transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
