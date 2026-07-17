"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabaseClient';
import confetti from 'canvas-confetti';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, wallet, signOut, refreshWallet, refreshProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Pro Modal states
  const [proModalOpen, setProModalOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isPro = user?.user_metadata?.is_pro === true;

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        loadNotifications();
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

  const handleBuyPro = async () => {
    if (!user || !wallet) return;
    if (wallet.balance < 500) {
      setPurchaseError("Insufficient TKN. Study more sessions to accumulate 500 TKN!");
      return;
    }

    setBuying(true);
    setPurchaseError(null);

    try {
      // 1. Deduct 500 tokens from wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - 500 })
        .eq('user_id', user.id);

      if (walletError) throw new Error("Wallet transaction failed.");

      // 2. Insert debit transaction
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: 500,
          description: 'Rig Upgrade: PRO FOCUS MODE Unlocked'
        });

      if (txnError) throw new Error("Transaction log registration failed.");

      // 3. Update auth user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { is_pro: true }
      });

      if (metadataError) throw new Error("User metadata subscription config failed.");

      // 3.5. Update public users table to make it public and visible to other users!
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (profileUpdateError) throw new Error("Public profile sync config failed.");

      // 4. Refresh wallet and local state
      await refreshWallet();
      await refreshProfile();
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 }
      });

      setProModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setPurchaseError(e.message || "An unexpected error occurred.");
    } finally {
      setBuying(false);
    }
  };

  // Hidden on root landing and auth pages for layout simplicity
  const authRoutes = ['/', '/login', '/signup', '/onboarding'];
  if (authRoutes.includes(pathname)) return null;

  return (
    <>
      {/* Desktop Top Header Bar */}
      <header className="hidden md:flex justify-between items-center h-16 px-8 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">
            Current Arena: <span className="text-primary-fixed font-bold">{pathname.split('/')[1]?.toUpperCase() || 'DASHBOARD'}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Wallet quick balance */}
          <Link href="/wallet" className="flex items-center gap-2.5 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-lg hover:border-primary-container transition-all">
            <span className="material-symbols-outlined text-primary-container text-sm font-bold">account_balance_wallet</span>
            <span className="font-label-mono text-xs text-on-surface-variant">Wallet:</span>
            <span className="font-label-mono text-sm text-primary-fixed font-bold">
              {wallet?.balance ?? 0} <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
            </span>
          </Link>

          {/* Go Pro trigger */}
          {isPro ? (
            <button 
              onClick={() => setProModalOpen(true)}
              className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all px-4 py-1.5 rounded-lg font-label-mono text-xs font-bold cursor-pointer uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            >
              ★ PRO ACTIVE
            </button>
          ) : (
            <button 
              onClick={() => setProModalOpen(true)}
              className="bg-primary-container/10 border border-primary-container/40 text-primary-fixed hover:bg-primary-container hover:text-on-primary transition-all px-4 py-1.5 rounded-lg font-label-mono text-xs font-bold cursor-pointer"
            >
              Go Pro
            </button>
          )}

          {/* Notification Button */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="text-on-surface-variant hover:text-primary-fixed transition-colors relative cursor-pointer focus:outline-none"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error"></span>
                </>
              )}
            </button>

            {notificationsOpen && (
              <>
                {/* Click outside to close */}
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                
                <div className="absolute right-0 mt-3 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30 text-xs font-mono">
                    <span className="font-bold text-on-surface uppercase tracking-tight">System Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-primary-fixed hover:underline text-[9px] uppercase font-bold cursor-pointer"
                      >
                        Clear unread
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-on-surface-variant font-mono text-center py-6 uppercase tracking-tight">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          className={`p-2.5 rounded-lg border text-[10px] font-mono transition-colors text-left ${
                            n.is_read 
                              ? 'bg-surface-container-low/40 border-outline-variant/10 text-on-surface-variant'
                              : 'bg-primary-container/5 border-primary-container/20 text-on-surface'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-bold uppercase tracking-tight text-[9px] ${
                              n.type === 'transaction' ? 'text-primary-fixed' : n.type === 'achievement' ? 'text-yellow-400' : 'text-on-surface'
                            }`}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
                            )}
                          </div>
                          <p className="mt-1 leading-normal break-words">{n.message}</p>
                          <p className="text-[8px] text-on-surface-variant/60 text-right mt-1.5">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings shortcut */}
          <button onClick={() => router.push('/settings')} className="text-on-surface-variant hover:text-primary-fixed transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>

          {/* User profile picture with dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-primary-fixed bg-surface-variant shrink-0 cursor-pointer focus:outline-none"
            >
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150'}
              />
            </button>

            {dropdownOpen && (
              <>
                {/* Click outside overlay to close */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                
                <div className="absolute right-0 mt-2 w-56 bg-surface-container border border-outline-variant rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-outline-variant/30 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-surface truncate">{profile?.name || 'Arena Fighter'}</span>
                      {isPro && (
                        <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-1 py-0.5 rounded font-black tracking-tighter uppercase shadow-[0_0_5px_rgba(234,179,8,0.2)]">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{profile?.email}</p>
                  </div>
                  <ul className="py-1 text-xs font-label-mono uppercase font-bold text-on-surface-variant space-y-1">
                    <li>
                      <Link 
                        href="/profile" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">person</span>
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-variant hover:text-on-surface transition-colors"
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-error-container/20 hover:text-error text-left transition-colors cursor-pointer"
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
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center p-4 bg-surface-container border-b border-outline-variant fixed top-0 left-0 w-full z-50">
        <h1 className="font-headline-md text-headline-md font-black text-primary-fixed select-none">
          FocusArena
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/wallet" className="flex items-center gap-1 font-label-mono text-sm text-primary-fixed font-bold bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant">
            <span>{wallet?.balance ?? 0}</span>
            <span className="text-[10px] text-on-surface-variant font-normal">TKN</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface hover:text-primary-fixed p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-45 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 bg-surface-container border-r border-outline-variant h-full p-4 flex flex-col pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-2 flex-grow">
              {[
                { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
                { name: 'Rooms', href: '/rooms', icon: 'groups' },
                { name: 'Challenges', href: '/challenges', icon: 'sports_esports' },
                { name: 'Arena', href: '/arena', icon: 'military_tech' },
                { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
                { name: 'Tasks', href: '/tasks', icon: 'checklist' },
                { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
                { name: 'Profile', href: '/profile', icon: 'person' },
                { name: 'Settings', href: '/settings', icon: 'settings' }
              ].map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg font-label-mono text-label-mono ${
                        isActive
                          ? 'text-on-primary bg-primary-container font-bold'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined">{link.icon}</span>
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto flex flex-col gap-4 border-t border-outline-variant/30 pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/study');
                }}
                className="w-full bg-primary-container text-on-primary font-bold py-3 rounded-lg font-label-mono text-label-mono flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Start Sprint
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full border border-outline-variant hover:border-error text-on-surface hover:text-error py-2.5 rounded-lg font-label-mono text-xs flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Go Pro Checkout Modal */}
      {proModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setProModalOpen(false)}>
          <div className="clay-card max-w-md w-full p-6 space-y-6 relative overflow-hidden border-t-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.25)]" onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button 
              onClick={() => setProModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Header info */}
            <div className="text-center space-y-2">
              <span className="font-label-mono text-[9px] bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-3 py-1 rounded-full uppercase font-black tracking-widest inline-block shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                RIG CONSOLE UPGRADE
              </span>
              <h3 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight mt-1">
                Go Pro Study Mode
              </h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Supercharge your cognitive tracking system and unlock ultimate study reward multipliers.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 bg-surface-container/50 p-3 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-yellow-400 shrink-0 mt-0.5">diamond</span>
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">2x Sprints Payout Multipliers</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">
                    Receive double tokens for every focus second completed. Accelerate your wallet winnings!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-surface-container/50 p-3 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary-fixed shrink-0 mt-0.5">palette</span>
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">Premium Background Themes</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">
                    Customize your Study page layout with Cyber Neon, Frozen Ice, Sunset Glow, or Volcanic Fire.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-surface-container/50 p-3 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-secondary-fixed shrink-0 mt-0.5">workspace_premium</span>
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">Glowing PRO Badge</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">
                    Unlock a premium gold stars title next to your profile on dashboards, rooms, and leaderboards.
                  </p>
                </div>
              </div>
            </div>

            {/* Error alerts */}
            {purchaseError && (
              <div className="p-3 bg-error-container/10 border border-error text-error text-xs font-mono rounded-lg">
                {purchaseError}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              {isPro ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-label-mono text-xs font-bold py-3.5 rounded-xl text-center uppercase tracking-wider">
                  ✓ You are already a PRO Member
                </div>
              ) : (
                <button
                  disabled={buying}
                  onClick={handleBuyPro}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-surface-variant text-black font-label-mono text-xs font-black py-4 rounded-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                >
                  <span className="material-symbols-outlined text-base">shopping_cart</span>
                  {buying ? 'Upgrading Rig...' : 'Unlock Pro Mode for 500 TKN'}
                </button>
              )}

              <button
                onClick={() => setProModalOpen(false)}
                className="w-full bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface font-label-mono text-xs font-bold py-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Back to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
