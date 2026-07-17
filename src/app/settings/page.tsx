"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Settings states
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120);
  const [cameraTracking, setCameraTracking] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setAlert(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
          daily_goal_minutes: dailyGoal
        })
        .eq('id', user.id);

      if (error) {
        setAlert({ type: 'error', text: 'Failed to update settings parameters.' });
      } else {
        await refreshProfile();
        setAlert({ type: 'success', text: 'Rig parameters configured successfully.' });
      }
    } catch (e) {
      console.error(e);
      setAlert({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Rig & Console Settings</h2>
        <p className="text-xs text-on-surface-variant mt-1">Configure profile metadata, daily target margins, and camera devices</p>
      </header>

      {alert && (
        <div className={`border rounded-lg p-4 text-xs flex items-center gap-3 ${
          alert.type === 'error' ? 'bg-error-container/15 border-error/50 text-error' : 'bg-primary-container/15 border-primary-container/50 text-primary-fixed'
        }`}>
          <span className="material-symbols-outlined text-sm">info</span>
          <span>{alert.text}</span>
        </div>
      )}

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side (8 cols): Setup Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSaveSettings} className="glass-panel rounded-xl p-6 space-y-6">
            
            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Account Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-mono text-[10px] text-on-surface-variant mb-1.5 uppercase font-bold">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                  />
                </div>
                <div>
                  <label className="block font-label-mono text-[10px] text-on-surface-variant mb-1.5 uppercase font-bold">Avatar URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://image-source-link.com"
                    className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                  />
                </div>
              </div>
            </div>

            {/* Target Settings */}
            <div className="space-y-4 border-t border-outline-variant/30 pt-6">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Focus Target Intervals</h3>
              <div>
                <label className="block font-label-mono text-[10px] text-on-surface-variant mb-1.5 uppercase font-bold">Daily Study Limit (Minutes)</label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2 font-mono text-xs text-on-surface focus:outline-none focus:border-primary-fixed"
                />
              </div>
            </div>

            {/* Toggle components */}
            <div className="space-y-4 border-t border-outline-variant/30 pt-6">
              <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Privacy & Devices</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-background border border-outline-variant rounded-xl">
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">Webcam eye tracking checks</h4>
                  <p className="text-[9px] text-on-surface-variant mt-0.5">Permits browser face-alignment testing during money sprints.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraTracking(!cameraTracking)}
                  className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-colors cursor-pointer ${
                    cameraTracking ? 'bg-primary-container' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-background rounded-full absolute transition-all ${
                    cameraTracking ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-primary-container text-on-primary font-label-mono text-xs font-bold py-3 px-6 rounded-lg hover:bg-primary-fixed transition-colors shadow-[0_0_10px_rgba(0,255,163,0.15)] cursor-pointer"
            >
              {saving ? 'Saving Specs...' : 'Update Settings'}
            </button>
          </form>
        </div>

        {/* Right Column (4 cols): Notification switches */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-xl p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">Announcements Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">Email Bulletins</h4>
                  <p className="text-[8px] text-on-surface-variant mt-0.5">Receive alerts when money rooms settle payouts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-colors cursor-pointer ${
                    emailAlerts ? 'bg-primary-container' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-background rounded-full absolute transition-all ${
                    emailAlerts ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
                <div>
                  <h4 className="font-label-mono text-xs font-bold text-on-surface uppercase">Weekly Reports</h4>
                  <p className="text-[8px] text-on-surface-variant mt-0.5">Summary of sprint logs and focus score analytics.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklyReports(!weeklyReports)}
                  className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-colors cursor-pointer ${
                    weeklyReports ? 'bg-primary-container' : 'bg-surface-variant'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-background rounded-full absolute transition-all ${
                    weeklyReports ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
