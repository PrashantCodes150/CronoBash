"use client";

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface ChartPoint {
  time: string;
  level: number;
  "hand-down"?: number;
  "gaze-away"?: number;
  "eye-closed"?: number;
  "face-absent"?: number;
  "static-frame"?: number;
}

interface FocusScoreChartProps {
  data: ChartPoint[];
  showDistractions?: boolean;
}

export default function FocusScoreChart({ data, showDistractions = false }: FocusScoreChartProps) {
  const chartData = data.length > 0 ? data : [{ time: '00:00', level: 100, "hand-down": 0, "gaze-away": 0, "eye-closed": 0, "face-absent": 0, "static-frame": 0 }];

  return (
    <div className="w-full h-44 bg-neutral-950/80 border border-neutral-850 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between w-full z-10">
        <span className="text-xs font-semibold text-neutral-450 uppercase tracking-wider font-mono">Focus Timeline Trends</span>
        {data.length > 0 && !showDistractions && (
          <span className="text-xs font-bold text-emerald-400 font-mono">
            CURRENT: {data[data.length - 1].level.toFixed(0)}%
          </span>
        )}
      </div>

      <div className="w-full h-[120px] pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="focusColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="handColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gazeColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#525252"
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={showDistractions ? [0, 'auto'] : [0, 100]}
              stroke="#525252"
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ color: '#a3a3a3' }}
            />
            
            {showDistractions ? (
              <>
                <Area type="monotone" dataKey="hand-down" stackId="1" stroke="#ef4444" fill="url(#handColor)" name="Hands 👋" />
                <Area type="monotone" dataKey="gaze-away" stackId="1" stroke="#f97316" fill="url(#gazeColor)" name="Gaze 👀" />
                <Area type="monotone" dataKey="eye-closed" stackId="1" stroke="#3b82f6" fillOpacity={0.15} fill="#3b82f6" name="Sleep 😴" />
                <Area type="monotone" dataKey="face-absent" stackId="1" stroke="#eab308" fillOpacity={0.15} fill="#eab308" name="Absent 👤" />
                <Area type="monotone" dataKey="static-frame" stackId="1" stroke="#a855f7" fillOpacity={0.15} fill="#a855f7" name="Static 📺" />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="level"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#focusColor)"
                name="Focus Efficiency"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
