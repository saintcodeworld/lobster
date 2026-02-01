'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface ChartProps {
  dataA: number[]
  dataB: number[]
  nameA?: string
  nameB?: string
}

export function AIComparisonChart({ dataA, dataB, nameA = "Molt", nameB = "Blue Molt" }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const maxValue = Math.max(...dataA, ...dataB, 10)
    const minValue = Math.min(...dataA, ...dataB, -10)
    const range = maxValue - minValue

    const drawLine = (data: number[], color: string, glow: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.shadowColor = glow

      data.forEach((value, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((value - minValue) / range) * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
      ctx.shadowBlur = 0
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    drawLine(dataA, 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.5)')
    drawLine(dataB, 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.5)')

  }, [dataA, dataB])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-full"
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={240}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />

      <div className="absolute top-4 left-4 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-zinc-400">{nameA}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-zinc-400">{nameB}</span>
        </div>
      </div>
    </motion.div>
  )
}
