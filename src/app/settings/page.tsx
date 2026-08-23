"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Shield, Bell, Camera, User, Lock, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Settings states
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [dailyGoal, setDailyGoal] = useState<number>(profile?.daily_goal_minutes || 120);

  // Real Black Pill Toggle Switches (Persisted in LocalStorage)
  const [cameraTracking, setCameraTracking] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('setting_camera_tracking') !== 'false';
    }
    return true;
  });

  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('setting_email_alerts') !== 'false';
    }
    return true;
  });

  const [weeklyReports, setWeeklyReports] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('setting_weekly_reports') !== 'false';
    }
    return true;
  });

  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('setting_sound_effects') !== 'false';
    }
    return true;
  });

  const handleToggleCamera = () => {
    const nextVal = !cameraTracking;
    setCameraTracking(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_camera_tracking', String(nextVal));
    }
    toast.success(nextVal ? 'Webcam focus check enabled.' : 'Webcam tracking disabled.');
  };

  const handleToggleEmailAlerts = () => {
    const nextVal = !emailAlerts;
    setEmailAlerts(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_email_alerts', String(nextVal));
    }
    toast.success(nextVal ? 'Email notifications active.' : 'Email notifications muted.');
  };

  const handleToggleWeeklyReports = () => {
    const nextVal = !weeklyReports;
    setWeeklyReports(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_weekly_reports', String(nextVal));
    }
    toast.success(nextVal ? 'Weekly study report emails enabled.' : 'Weekly reports disabled.');
  };

  const handleToggleSoundEffects = () => {
    const nextVal = !soundEffects;
    setSoundEffects(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_sound_effects', String(nextVal));
    }
    toast.success(nextVal ? 'Audio sound effects active.' : 'Sound effects muted.');
  };

  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = newPassword.trim();
    if (!pwd) {
      toast.error('Please enter a new password.');
      return;
    }
    if (pwd.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      toast.error('Password must include both letters and numbers for high security.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) {
        toast.error(error.message || 'Failed to update password.');
      } else {
        toast.success('Password set successfully! 🔐 You can now login with either Google or Email + Password.');
        setNewPassword('');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
          daily_goal_minutes: Number(dailyGoal) || 120
        })
        .eq('id', user.id);

      try {
        await supabase
          .from('leaderboard_cache')
          .update({
            name: name.trim(),
            avatar_url: avatarUrl.trim() || null,
          })
          .eq('user_id', user.id);
      } catch (lErr) {
        console.warn('Leaderboard cache sync warning:', lErr);
      }

      if (error) {
        toast.error('Failed to update settings parameters.');
      } else {
        await refreshProfile();
        toast.success('Settings saved successfully! ⚙️');
      }
    } catch (e) {
      console.error(e);
      toast.error('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* ── TOP METRIC CARDS ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Account Status</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Verified User ✓</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Camera Tracking</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{cameraTracking ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Email Alerts</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{emailAlerts ? 'Active' : 'Muted'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Daily Target Goal</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{dailyGoal || 120} Mins</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </motion.div>

      {/* ── SETTINGS FORM & BLACK PILL CONTROLS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Account Details & Target Settings */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          
          <form onSubmit={handleSaveSettings} className="morphism-card bg-white p-6 md:p-8 rounded-[28px] border border-white/80 shadow-sm space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-[#3B82F6]" />
                <span>Account Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://image-url.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <span>Focus Targets</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Study Goal (Minutes)</label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={Number.isNaN(dailyGoal) || dailyGoal === 0 ? '' : dailyGoal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setDailyGoal(Number.isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-3 px-6 rounded-full transition-transform hover:scale-105 cursor-pointer shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

          </form>

          {/* Security & Set Password Section */}
          <form onSubmit={handleSetPassword} className="morphism-card bg-white p-6 md:p-8 rounded-[28px] border border-white/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-[#9333EA]" />
              <span>Login Password &amp; Credentials</span>
            </h3>

            <p className="text-xs text-slate-500 font-medium">
              Set a password below so you can sign in directly with Email + Password, even if you originally registered using Google OAuth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Account Password</label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Enter 6+ character password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#9333EA]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={updatingPassword || !newPassword}
                  className="w-full bg-[#9333EA] hover:bg-[#7e22ce] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{updatingPassword ? 'Updating...' : 'Set Password'}</span>
                </button>
              </div>
            </div>
          </form>

        </motion.div>

        {/* Real Black Pill Switches Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-4 morphism-card bg-white p-6 rounded-[28px] border border-white/80 shadow-sm space-y-5">
          <h3 className="font-extrabold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F59E0B]" />
            <span>Preferences &amp; Devices</span>
          </h3>

          <div className="space-y-4">
            
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Webcam Focus Tracking</span>
                <button
                  onClick={handleToggleCamera}
                  className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    cameraTracking ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${cameraTracking ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Permits face-alignment checks during study sprints.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Email Notifications</span>
                <button
                  onClick={handleToggleEmailAlerts}
                  className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    emailAlerts ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Receive squad study invites &amp; rank alerts.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Weekly Progress Report</span>
                <button
                  onClick={handleToggleWeeklyReports}
                  className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    weeklyReports ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${weeklyReports ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Receive weekly breakdown of focus hours.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">Sound Chimes &amp; FX</span>
                <button
                  onClick={handleToggleSoundEffects}
                  className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    soundEffects ? 'bg-[#1D1D1F]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${soundEffects ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Plays audio chimes when timers finish.</p>
            </div>

          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
