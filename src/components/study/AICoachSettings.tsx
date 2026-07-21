"use client";

import React from 'react';
import { ToggleLeft, ToggleRight, Volume2, Globe, FileText } from 'lucide-react';

interface AICoachSettingsProps {
  coachEnabled: boolean;
  setCoachEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
  language: string;
  setLanguage: (lang: string) => void;
  customMessage: string;
  setCustomMessage: (msg: string) => void;
}

export function AICoachSettings({
  coachEnabled,
  setCoachEnabled,
  volume,
  setVolume,
  language,
  setLanguage,
  customMessage,
  setCustomMessage
}: AICoachSettingsProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl text-white font-mono space-y-4">
      {/* Header Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <span className="text-xs font-extrabold uppercase text-orange-500">AI Focus Coach</span>
        <button 
          onClick={() => setCoachEnabled(!coachEnabled)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {coachEnabled ? (
            <ToggleRight className="w-6 h-6 text-orange-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-neutral-500" />
          )}
        </button>
      </div>

      {coachEnabled && (
        <div className="space-y-3.5 text-[11px] text-neutral-350">
          {/* Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <Volume2 className="w-3.5 h-3.5 text-neutral-550" />
              Volume: {volume}%
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-orange-500 h-1 bg-black rounded-lg cursor-pointer"
            />
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <Globe className="w-3.5 h-3.5 text-neutral-550" />
              Voice Pack Lang
            </label>
            <div className="flex bg-black p-1 border border-neutral-800 rounded gap-1">
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-all ${language === 'hi-IN' ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:text-white'}`}
              >
                Hindi / Hinglish
              </button>
              <button
                onClick={() => setLanguage('en-US')}
                className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-all ${language === 'en-US' ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:text-white'}`}
              >
                English US
              </button>
            </div>
          </div>

          {/* Custom Message Input */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <FileText className="w-3.5 h-3.5 text-neutral-550" />
              Custom Alert Warning
            </label>
            <input 
              type="text"
              placeholder="e.g. Padh le varna mummy daantengi"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="bg-black border border-neutral-800 rounded p-2 text-[10px] text-neutral-350 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
