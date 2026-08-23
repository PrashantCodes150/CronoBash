"use client";

import React from 'react';

// LinkedIn Icon SVG
function LinkedInIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" />
    </svg>
  );
}

// GitHub Icon SVG
function GitHubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// Globe Icon SVG (Portfolio)
function GlobeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}

export default function FounderNoteSection() {
  return (
    <section className="py-24 sm:py-32 w-full max-w-[1200px] mx-auto px-6 md:px-16 border-t border-surface-variant relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Founder Avatar & Profile Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-prompt-brown/30 p-1 bg-surface-container-lowest shadow-md group">
            <img
              src="/prashant_singh.png"
              alt="Prashant Singh - Founder"
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-xl font-bold text-[#0a0a0a] font-sans">Prashant Singh</h4>
            <p className="text-xs font-bold text-prompt-brown uppercase tracking-[0.06em] font-sans">
              Founder &amp; Lead Developer
            </p>
          </div>

          {/* Social & Portfolio Links (LinkedIn, GitHub & Portfolio Website) */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://www.linkedin.com/in/prashant-singh-84a2a7332"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all hover:scale-110"
              title="Prashant Singh LinkedIn Profile"
            >
              <LinkedInIcon className="w-5 h-5" />
            </a>

            <a
              href="https://github.com/PrashantCodes150"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#181717] hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all hover:scale-110"
              title="Prashant Singh GitHub Profile"
            >
              <GitHubIcon className="w-5 h-5" />
            </a>

            <a
              href="https://github.com/PrashantCodes150"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#2563EB] hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all hover:scale-110"
              title="Prashant Singh Portfolio Website"
            >
              <GlobeIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Founder Note Content Column (8 cols) — Matches Editorial Theme */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-prompt-brown font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-prompt-brown" />
              Founder&apos;s Note
            </span>
            <h3 className="text-[clamp(28px,4vw,40px)] font-medium text-[#0a0a0a] tracking-[-0.03em] leading-[1.1] font-sans">
              Why I built CronoBash.
            </h3>
          </div>

          <blockquote className="border-l-2 border-prompt-brown pl-6 py-1 text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed font-sans italic">
            &ldquo;Like many of you, I struggled with staying consistent during long study sessions. Solitary studying made it easy to fall into phone distractions and procrastination. I built CronoBash to turn study into a collaborative, high-stakes game — where you stay accountable, study alongside peers, and make every focus sprint count.&rdquo;
          </blockquote>

          <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm text-on-surface-variant font-normal font-sans">
            <span>Built for students and deep workers worldwide —</span>
            <span className="font-['Special_Elite'] text-base text-[#0a0a0a] select-none">
              CronoBash
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
