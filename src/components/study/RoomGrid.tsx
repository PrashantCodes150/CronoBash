"use client";

import React from 'react';
import { VSDivider } from './VSDivider';
import { CameraTile } from './CameraTile';

interface RoomGridProps {
  members: { id: string; name: string; avatarUrl?: string; isFocused?: boolean; isMuted?: boolean; distractionCount?: number; isSpectator?: boolean }[];
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
      <div className="relative w-full h-full min-h-[50vh] flex flex-col justify-center p-4">
        {/* Responsive Flex/Grid representing 1v1 stacked or side-by-side splits */}
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
            />
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic grid columns count
  const gridCols = Math.min(4, Math.ceil(Math.sqrt(activeMembers.length)));

  return (
    <div className="w-full flex-grow flex flex-col p-4">
      <div 
        className="grid gap-4 p-3 overflow-auto max-h-[70vh] w-full max-w-7xl mx-auto snap-y" 
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {activeMembers.map(m => (
          <div key={m.id} className="snap-start aspect-square">
            <CameraTile
              userId={m.id}
              name={m.name}
              stream={streams.get(m.id) || undefined}
              isSelf={m.id === selfId}
              isFocused={m.isFocused !== false}
              isMuted={m.isMuted === true}
              distractionCount={m.distractionCount || 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomGrid;
