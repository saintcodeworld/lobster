'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

export function CountdownTimer({ targetDate }: { targetDate: string | Date }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime()
            const target = new Date(targetDate).getTime()
            const distance = target - now

            if (distance < 0) {
                setTimeLeft('00:00:00')
                return
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((distance % (1000 * 60)) / 1000)

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }

        calculateTime()
        const interval = setInterval(calculateTime, 1000)

        return () => clearInterval(interval)
    }, [targetDate])

    return (
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur border border-zinc-700/50 rounded-full px-4 py-2 shadow-xl shadow-black/50">
            <Timer size={16} className="text-yellow-500 animate-pulse" />
            <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Round Ends In</span>
                <span className="font-mono text-white text-lg font-bold tracking-wider">{timeLeft}</span>
            </div>
        </div>
    )
}
