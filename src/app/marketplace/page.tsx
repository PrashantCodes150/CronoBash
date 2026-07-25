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
      <div className="glass-panel rounded-2xl p-6 md:p-8 border-l-4 border-primary-fixed bg-grid-pattern relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary-fixed text-3xl animate-bounce">storefront</span>
            <h1 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Arena Marketplace</h1>
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant max-w-xl leading-relaxed uppercase">
            UPGRADE YOUR CRONOBASH STUDY ENVIRONMENT WITH AESTHETIC HIGHLIGHTS, SPECIAL AUDIO PROFILES, AND CYBER RIG ENVIRONMENTS.
          </p>
        </div>
      </div>

      {/* Coming Soon Overlay Grid */}
      <div className="relative">
        
        {/* Glassmorphic coming soon banner overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] z-10 rounded-2xl flex flex-col items-center justify-center border border-outline-variant/30 shadow-2xl p-8 text-center">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 bg-[#ffaa00]/10 border border-[#ffaa00]/40 text-[#ffaa00] font-label-mono text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-[0_0_15px_rgba(255,170,0,0.15)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              Coming Soon
            </div>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight leading-none">Marketplace Under Construction</h2>
            <p className="font-mono text-[10px] text-on-surface-variant leading-relaxed uppercase">
              WE ARE CALIBRATING THE CRYPTO TRANSACTIONS INTEGRATION & DEVELOPING MORE EXCLUSIVE RIG COSMETICS. EXPECT LAUNCH IN EPOC B-3!
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 bg-primary-container text-on-primary font-label-mono text-xs font-bold px-6 py-3 rounded-xl hover:bg-primary-fixed transition-colors cursor-pointer uppercase border border-primary-container"
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
