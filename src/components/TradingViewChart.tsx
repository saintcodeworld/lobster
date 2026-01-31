'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface ChartProps {
  dataA: { time: string; value: number }[]
  dataB: { time: string; value: number }[]
  colorA?: string
  colorB?: string
  height?: number
}

export function TradingViewChart({
  dataA,
  dataB,
  colorA = 'oklch(0.7 0.15 240)', // Primary
  colorB = '#3b82f6', // Blue-500
  height = 350,
}: ChartProps) {
  const mergedData = dataA.map((point, i) => ({
    time: point.time,
    valueA: point.value,
    valueB: dataB[i]?.value || 0,
  }))

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorA} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorA} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorB} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorB} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.03)" 
            vertical={false} 
          />
          
          <XAxis
            dataKey="time"
            stroke="#3f3f46"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => format(new Date(str), 'HH:mm')}
            minTickGap={50}
            dy={10}
          />
          
          <YAxis
            stroke="#3f3f46"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-geist-mono)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(num) => `${num > 0 ? '+' : ''}${num.toFixed(0)}%`}
          />
          
          <Tooltip
            cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length && label) {
                return (
                  <div className="bg-zinc-950/90 border border-zinc-800 p-3 shadow-xl backdrop-blur-md rounded-lg">
                    <div className="text-zinc-500 text-[10px] font-mono mb-2 uppercase tracking-wider">
                      {format(new Date(label), 'MMM dd, HH:mm')}
                    </div>
                    {payload.map((entry: any, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-mono mb-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: entry.stroke }}
                        />
                        <span className="text-zinc-400 w-20 text-[10px] font-medium uppercase tracking-wider">
                          {entry.dataKey === 'valueA' ? 'Contender A' : 'Contender B'}
                        </span>
                        <span className={`font-bold ${entry.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
          
          <Area
            type="monotone"
            dataKey="valueA"
            stroke={colorA}
            fillOpacity={1}
            fill="url(#colorA)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          
          <Area
            type="monotone"
            dataKey="valueB"
            stroke={colorB}
            fillOpacity={1}
            fill="url(#colorB)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
