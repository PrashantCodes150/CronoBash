"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ConsistencyGaugeProps {
  score: number; // 0 to 100
}

export function ConsistencyGauge({ score }: ConsistencyGaugeProps) {
  const percent = Math.min(100, Math.max(0, score));
  const data = [
    { value: percent },
    { value: 100 - percent }
  ];

  return (
    <div className="w-full h-full bg-neutral-950/80 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between items-center relative">
      <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider font-mono self-start">Focus Consistency</span>
      
      <div className="w-full h-[140px] flex items-center justify-center relative mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={70}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#10b981" />
              <Cell fill="#262626" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay label */}
        <div className="absolute bottom-[20%] flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">{percent}%</span>
          <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">Steady State</span>
        </div>
      </div>
    </div>
  );
}
