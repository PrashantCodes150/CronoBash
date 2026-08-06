"use client";

import React from 'react';

const INSTITUTIONS = ['IIT Delhi', 'Harvard', 'Oxford', 'MIT', 'Stanford', 'IIM'];

export default function SocialProofStrip() {
  return (
    <section className="py-20 bg-surface-container-low border-y border-surface-variant">
      <div className="max-w-[1200px] mx-auto px-6 md:px-16 text-center reveal">
        <p className="text-[12px] font-semibold leading-[16px] tracking-[0.08em] text-outline mb-8 uppercase">
          Trusted by students at elite institutions
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale">
          {INSTITUTIONS.map((name) => (
            <div key={name} className="text-[20px] leading-[28px] font-bold text-on-surface-variant">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
