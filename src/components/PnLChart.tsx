'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const mockData = [
  { time: '00:00', walletA: 0, walletB: 0 },
  { time: '04:00', walletA: 12.5, walletB: 8.3 },
  { time: '08:00', walletA: 28.4, walletB: 15.7 },
  { time: '12:00', walletA: 45.2, walletB: 32.1 },
  { time: '16:00', walletA: 89.5, walletB: 67.4 },
  { time: '20:00', walletA: 127.5, walletB: 89.2 },
]

interface PnLChartProps {
  walletALabel: string
  walletBLabel: string
}

export function PnLChart({ walletALabel, walletBLabel }: PnLChartProps) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #A855F7',
              borderRadius: '8px',
              color: '#F3F4F6',
            }}
            formatter={(value: number | undefined) => value ? [`${value.toFixed(2)}%`, ''] : ['0%', '']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="walletA"
            stroke="#A855F7"
            strokeWidth={3}
            dot={{ fill: '#A855F7', r: 4 }}
            name={walletALabel}
          />
          <Line
            type="monotone"
            dataKey="walletB"
            stroke="#EC4899"
            strokeWidth={3}
            dot={{ fill: '#EC4899', r: 4 }}
            name={walletBLabel}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
