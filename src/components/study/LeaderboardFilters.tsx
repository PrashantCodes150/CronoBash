"use client";

import React from 'react';

interface LeaderboardFiltersProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  roomType: string;
  setRoomType: (type: string) => void;
  skillLevel: string;
  setSkillLevel: (level: string) => void;
}

export function LeaderboardFilters({
  timeRange,
  setTimeRange,
  roomType,
  setRoomType,
  skillLevel,
  setSkillLevel
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white">
      
      {/* Time Range Selection */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Time Window</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-black border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-300 w-full sm:w-44 focus:outline-none focus:border-orange-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="alltime">All Time</option>
        </select>
      </div>

      {/* Room Type Selection */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Room Class</label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="bg-black border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-300 w-full sm:w-44 focus:outline-none focus:border-orange-500"
        >
          <option value="all">All Arenas</option>
          <option value="public">Public Lobby</option>
          <option value="private">Private Group</option>
          <option value="money">Money Stakes</option>
        </select>
      </div>

      {/* Skill Tier Tabs */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Competitor Bracket</label>
        <div className="flex bg-black p-1 border border-neutral-800 rounded gap-1">
          {['beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSkillLevel(lvl)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase transition ${
                skillLevel === lvl 
                  ? 'bg-orange-500 text-white font-bold' 
                  : 'text-neutral-450 hover:text-white'
              }`}
            >
              {lvl.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
