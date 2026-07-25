"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MarketplacePage() {
  const router = useRouter();

  const marketplaceItems = [
    { id: 'item-1', name: 'Cyberpunk Red Rig Theme', price: '500 TKN', category: 'Themes', desc: 'A neon-drenched crimson rig theme for intense focus duels.' },
    { id: 'item-2', name: 'Vortex Ambient Audio Pack', price: '250 TKN', category: 'Audio', desc: 'Binaural beats and cosmic wind synthesizer frequencies.' },
    { id: 'item-3', name: 'Golden Champion Avatar Border', price: '1,000 TKN', category: 'Cosmetics', desc: 'Showcase your focus dominance with a glowing profile frame.' },
    { id: 'item-4', name: 'Calm Zen Forest Soundscape', price: '300 TKN', category: 'Audio', desc: 'Gentle raindrops, wind chimes, and calming stream ambient loops.' },
    { id: 'item-5', name: 'Holographic Banner Header', price: '750 TKN', category: 'Cosmetics', desc: 'Custom profile banner backdrop featuring active glitch animations.' },
    { id: 'item-6', name: 'Liquid Mercury Rig Skin', price: '1,200 TKN', category: 'Themes', desc: 'Metallic glassmorphic borders that reflect and flow dynamically.' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-in fade-in slide-in-from-bottom-6 duration-500 select-none text-left">
      
      {/* Title Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-surface-container relative overflow-hidden shadow-[0_0_30px_rgba(0,255,163,0.15)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(0,255,163,0.3)] animate-pulse">
              <span className="material-symbols-outlined text-2xl font-bold animate-bounce">storefront</span>
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">Arena Marketplace</h1>
              <p className="font-mono text-xs text-emerald-300 font-semibold">Custom Themes, Ambient Soundscapes &amp; Profile Badges</p>
            </div>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant max-w-xl leading-relaxed uppercase pt-1">
            UPGRADE YOUR CRONOBASH STUDY ENVIRONMENT WITH AESTHETIC HIGHLIGHTS, SPECIAL AUDIO PROFILES, AND CYBER RIG ENVIRONMENTS.
          </p>
        </div>
      </div>

      {/* Coming Soon Overlay Grid */}
      <div className="relative">
        
        {/* Glassmorphic coming soon banner overlay */}
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-10 rounded-3xl flex flex-col items-center justify-center border border-amber-500/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] p-8 text-center">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-400 font-label-mono text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Official Feature Preview
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none bg-gradient-to-r from-amber-400 via-orange-400 to-white bg-clip-text text-transparent">
              Marketplace Under Construction
            </h2>
            <p className="font-mono text-xs text-amber-300/80 leading-relaxed uppercase">
              WE ARE CALIBRATING THE REWARDS TRANSACTIONS INTEGRATION &amp; DEVELOPING MORE EXCLUSIVE RIG COSMETICS. EXPECT LAUNCH SHORTLY!
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-label-mono text-xs font-extrabold px-8 py-3.5 rounded-xl transition-all cursor-pointer uppercase border border-emerald-400 shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:scale-105"
            >
              Return to Control Center
            </button>
          </div>
        </div>

        {/* Locked Grid (visible behind overlay) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 select-none pointer-events-none">
          {marketplaceItems.map(item => (
            <div key={item.id} className="card-base p-6 border border-outline-variant/30 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[8px] bg-surface-container-high border border-outline-variant text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
                  <span className="font-mono text-xs font-black text-[#00ffa3]">{item.price}</span>
                </div>
                <h3 className="font-display text-sm font-bold text-on-surface uppercase truncate">{item.name}</h3>
                <p className="font-mono text-[9px] text-on-surface-variant leading-relaxed uppercase">{item.desc}</p>
              </div>
              <button className="w-full py-2 bg-neutral-900 border border-outline-variant/40 rounded-lg text-neutral-600 font-mono text-[10px] uppercase font-bold">
                Acquire item
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
