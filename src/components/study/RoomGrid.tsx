"use client";

import React from 'react';
import { VSDivider } from './VSDivider';
import { CameraTile } from './CameraTile';

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  isFocused?: boolean;
  isMuted?: boolean;
  distractionCount?: number;
  focusScore?: number;
  focusSeconds?: number;
  focusTimeline?: { time: string; level: number }[];
  isSpectator?: boolean;
  gazeScore?: number;
  poseStability?: number;
  level?: number;
}

interface RoomGridProps {
  members: Member[];
  selfId: string;
  streams: Map<string, MediaStream | null>;
}

export function RoomGrid({ members, selfId, streams }: RoomGridProps) {
  const activeMembers = members.filter(m => !m.isSpectator);
  const is1v1 = activeMembers.length === 2;

  if (is1v1) {
    const self = activeMembers.find(m => m.id === selfId) || activeMembers[0];
    const opponent = activeMembers.find(m => m.id !== selfId) || activeMembers[1];

    return (
      <div className="relative w-full h-full min-h-[50vh] flex flex-col justify-center items-center p-4">
        {/* 1v1 Split Arena Layout */}
        <div className="relative w-full max-w-5xl h-full flex flex-col md:flex-row gap-6 items-center justify-center">
          <div className="w-full flex-1 aspect-video md:aspect-square">
            <CameraTile
              userId={self.id}
              name={self.name}
              stream={streams.get(self.id) || undefined}
              isSelf={self.id === selfId}
              isFocused={self.isFocused !== false}
              isMuted={self.isMuted === true}
              distractionCount={self.distractionCount || 0}
              focusScore={self.focusScore}
              focusSeconds={self.focusSeconds}
              focusTimeline={self.focusTimeline}
              gazeScore={self.gazeScore}
              poseStability={self.poseStability}
              level={self.level}
            />
          </div>

          <VSDivider />

          <div className="w-full flex-1 aspect-video md:aspect-square">
            <CameraTile
              userId={opponent.id}
              name={opponent.name}
              stream={streams.get(opponent.id) || undefined}
              isSelf={opponent.id === selfId}
              isFocused={opponent.isFocused !== false}
              isMuted={opponent.isMuted === true}
              distractionCount={opponent.distractionCount || 0}
              focusScore={opponent.focusScore}
              focusSeconds={opponent.focusSeconds}
              focusTimeline={opponent.focusTimeline}
              gazeScore={opponent.gazeScore}
              poseStability={opponent.poseStability}
              level={opponent.level}
            />
          </div>
        </div>
      </div>
    );
  }

  const total = activeMembers.length;
  let gridStyle = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl";

  if (total <= 4) {
    gridStyle = "grid-cols-1 sm:grid-cols-2 max-w-4xl";
  } else if (total <= 6) {
    gridStyle = "grid-cols-2 md:grid-cols-3 max-w-5xl";
  } else if (total <= 10) {
    gridStyle = "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 max-w-7xl";
  }

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4">
      <div 
        className={`grid gap-4 p-2 overflow-y-auto max-h-[75vh] w-full mx-auto justify-center ${gridStyle}`}
      >
        {activeMembers.map(m => (
          <div key={m.id} className="aspect-square min-w-0 w-full">
            <CameraTile
              userId={m.id}
              name={m.name}
              stream={streams.get(m.id) || undefined}
              isSelf={m.id === selfId}
              isFocused={m.isFocused !== false}
              isMuted={m.isMuted === true}
              distractionCount={m.distractionCount || 0}
              focusScore={m.focusScore}
              focusSeconds={m.focusSeconds}
              focusTimeline={m.focusTimeline}
              gazeScore={m.gazeScore}
              poseStability={m.poseStability}
              level={m.level}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomGrid;
