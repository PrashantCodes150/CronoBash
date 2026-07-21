"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DistractionHeatmapProps {
  data: {
    'hand-down': number;
    'gaze-away': number;
    'eye-closed': number;
    'face-absent': number;
    'static-frame': number;
  };
}

export function DistractionHeatmap({ data }: DistractionHeatmapProps) {
  const chartData = [
    { name: 'Hands 👋', count: data['hand-down'] || 0, fill: '#ef4444' },
    { name: 'Gaze 👀', count: data['gaze-away'] || 0, fill: '#f97316' },
    { name: 'Eyes 😴', count: data['eye-closed'] || 0, fill: '#3b82f6' },
    { name: 'Absent 👤', count: data['face-absent'] || 0, fill: '#eab308' },
    { name: 'Static 📺', count: data['static-frame'] || 0, fill: '#a855f7' }
  ];

  return (
    <div className="w-full h-full bg-neutral-950/80 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between">
      <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider font-mono">Distraction Log Count</span>
      <div className="w-full h-[180px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: '6px' }}
              labelStyle={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
