'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthDialog } from '@/components/AuthDialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, TrendingDown, Activity, Zap, DollarSign, Target, BarChart3, Users, Swords, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { AIComparisonChart } from '@/components/AIComparisonChart'
import { LobsterLogo } from '@/components/LobsterLogo'
import { TokenActivityFeed } from '@/components/TokenActivityFeed'
import { useQuery } from '@tanstack/react-query'
import { useBattleWebSocket } from '@/hooks/useBattleWebSocket'
import { useTransactionStream } from '@/hooks/useTransactionStream'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

const CLAUDE_A = {
  name: "Claude",
  model: "Analytical Engine",
  color: "from-orange-500 to-red-600",
  accent: "orange",
  image: "/image.png"
}

const CLAUDE_B = {
  name: "Grok",
  model: "Truth Seeker",
  color: "from-zinc-500 to-zinc-900",
  accent: "zinc",
  image: "/image copy 2.png"
}

export default function Dashboard() {
  const { user, isLoading, getPublicKey, getKeypair } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>('A')
  const [userBalance, setUserBalance] = useState<number>(0)
  const publicKey = getPublicKey()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) return {}
      return res.json()
    },
    staleTime: 60000,
  })

  const { data: battleConfig } = useQuery({
    queryKey: ['battle-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/battle')
      if (!res.ok) return null
      return res.json()
    },
    refetchInterval: 30000,
  })

  const { data: battleStats, isLoading: statsLoading } = useQuery({
    queryKey: ['battle-stats'],
    queryFn: async () => {
      const res = await fetch('/api/battle/stats')
      if (!res.ok) return null
      return res.json()
    },
    refetchInterval: 3000,
    enabled: !!battleConfig,
  })

  useEffect(() => {
    if (!battleConfig) return

    const syncInterval = setInterval(async () => {
      try {
        await fetch('/api/battle/sync-cron')
      } catch (err) {
        console.error('Auto-sync failed:', err)
      }
    }, 15000)

    return () => clearInterval(syncInterval)
  }, [battleConfig])

  const walletAAddress = battleConfig?.walletA?.address || ''
  const walletBAddress = battleConfig?.walletB?.address || ''
  const initialA = battleConfig?.match?.initialBalanceA || 0
  const initialB = battleConfig?.match?.initialBalanceB || 0

  const { dataA, dataB, setDataA, setDataB } = useBattleWebSocket(
    walletAAddress,
    walletBAddress,
    initialA,
    initialB
  )

  const txStream = useTransactionStream(walletAAddress, walletBAddress)

  useEffect(() => {
    if (battleStats?.walletA) {
      setDataA(battleStats.walletA)
    }
    if (battleStats?.walletB) {
      setDataB(battleStats.walletB)
    }
  }, [battleStats, setDataA, setDataB])

  const statsA = battleStats?.walletA ? {
    pnl: battleStats.walletA.pnl || 0,
    dailyPnl: battleStats.walletA.dailyPnl || 0,
    trades: battleStats.walletA.trades24h || battleStats.walletA.trades || 0,
    volume: battleStats.walletA.volume || 0,
    totalValue: battleStats.walletA.totalValue || 0,
    tokens: battleStats.walletA.tokens || []
  } : { pnl: 0, dailyPnl: 0, trades: 0, volume: 0, totalValue: 0, tokens: [] }

  const statsB = battleStats?.walletB ? {
    pnl: battleStats.walletB.pnl || 0,
    dailyPnl: battleStats.walletB.dailyPnl || 0,
    trades: battleStats.walletB.trades24h || battleStats.walletB.trades || 0,
    volume: battleStats.walletB.volume || 0,
    totalValue: battleStats.walletB.totalValue || 0,
    tokens: battleStats.walletB.tokens || []
  } : { pnl: 0, dailyPnl: 0, trades: 0, volume: 0, totalValue: 0, tokens: [] }

  const { data: poolData } = useQuery({
    queryKey: ['bet-pools'],
    queryFn: async () => {
      const res = await fetch('/api/admin/pools')
      if (!res.ok) return { poolA: 0, poolB: 0, totalPool: 0 }
      return res.json()
    },
    refetchInterval: 5000,
    enabled: !!battleConfig,
  })

  const poolA = poolData?.poolA || 0
  const poolB = poolData?.poolB || 0
  const [recentBets, setRecentBets] = useState<Array<{
    user: string
    side: 'A' | 'B'
    amount: number
    time: string
  }>>([])

  const [chartDataA, setChartDataA] = useState<number[]>([0])
  const [chartDataB, setChartDataB] = useState<number[]>([0])

  const placeBet = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0 || !selectedSide || !user) return

    const userKeypair = getKeypair()
    if (!userKeypair) {
      toast.error('Wallet not initialized')
      return
    }

    const betValue = parseFloat(betAmount)
    if (userBalance < betValue + 0.000005) { // Add small buffer for fees
      toast.error('Insufficient SOL balance. Please deposit funds.')
      return
    }

    try {
      toast.loading('Processing transaction...', { id: 'bet-toast' })

      const { Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = await import('@solana/web3.js')
      const connection = new Connection(
        'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1',
        'confirmed'
      )

      const treasuryPubkey = new PublicKey(
        process.env.NEXT_PUBLIC_TREASURY_WALLET || 'ArLNcJPEZF3r1ETCJA6hbFaGTSk8GgcFX4c9wjvsRiNa'
      )

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: treasuryPubkey,
          lamports: parseFloat(betAmount) * LAMPORTS_PER_SOL
        })
      )

      const signature = await connection.sendTransaction(transaction, [userKeypair])
      await connection.confirmTransaction(signature, 'confirmed')

      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          matchId: battleConfig?.match?.id,
          side: selectedSide,
          amount: parseFloat(betAmount),
          txSignature: signature
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to place bet')
      }

      toast.success('Bet placed successfully!', { id: 'bet-toast' })

      const bet = {
        user: 'You',
        side: selectedSide,
        amount: parseFloat(betAmount),
        time: 'Just now'
      }

      setRecentBets(prev => [bet, ...prev.slice(0, 9)])
      setBetAmount('')
      setSelectedSide(null)
    } catch (error: any) {
      console.error('Error placing bet:', error)
      toast.error(error.message || 'Transaction failed', { id: 'bet-toast' })
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthDialog(true)
    }
  }, [user, isLoading])

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return

      try {
        const connection = new (await import('@solana/web3.js')).Connection(
          'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'
        )
        const balance = await connection.getBalance(publicKey)
        setUserBalance(balance / 1e9)
      } catch (error) {
        console.error('Error fetching balance:', error)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [publicKey])

  const prevPnlRef = useRef({ a: 0, b: 0 })

  useEffect(() => {
    if (battleStats?.walletA && battleStats?.walletB) {
      const pnlA = battleStats.walletA.pnl
      const pnlB = battleStats.walletB.pnl

      if (prevPnlRef.current.a !== pnlA || prevPnlRef.current.b !== pnlB) {
        prevPnlRef.current = { a: pnlA, b: pnlB }

        setChartDataA(prev => {
          const newData = [...prev, pnlA]
          return newData.slice(-50)
        })

        setChartDataB(prev => {
          const newData = [...prev, pnlB]
          return newData.slice(-50)
        })
      }
    }
  }, [battleStats?.walletA?.pnl, battleStats?.walletB?.pnl])


  const totalPool = poolA + poolB

  const dynamicOdds = useMemo(() => {
    const { calculateOddsFromPnL } = require('@/lib/odds')
    // Use Daily PnL for Betting Odds
    return calculateOddsFromPnL(statsA.dailyPnl, statsB.dailyPnl)
  }, [statsA.dailyPnl, statsB.dailyPnl])

  const oddsA = dynamicOdds.oddsA
  const oddsB = dynamicOdds.oddsB

  const tickerData = useMemo(() => {
    if (!dataA?.activities && !dataB?.activities) {
      return []
    }

    const allActivities = [
      ...(dataA?.activities || []).map((act: any) => ({
        wallet: 'SONNET',
        pair: act.mint?.slice(0, 4) || 'SOL',
        change: act.change || '0.00',
        color: 'text-red-400',
        type: act.type
      })),
      ...(dataB?.activities || []).map((act: any) => ({
        wallet: 'OPUS',
        pair: act.mint?.slice(0, 4) || 'SOL',
        change: act.change || '0.00',
        color: 'text-purple-400',
        type: act.type
      }))
    ]

    return [...allActivities, ...allActivities, ...allActivities]
  }, [dataA?.activities, dataB?.activities])

  if (isLoading || statsLoading || !battleConfig || !battleStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LobsterLogo className="w-16 h-16 text-primary animate-pulse" />
          <p className="text-zinc-500 font-mono">Loading battle data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className={clsx(
        "absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-background to-background",
        !user && "blur-md"
      )}>
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px] mix-blend-screen opacity-40" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] mix-blend-screen opacity-40" />
      </div>

      {settings?.contract_address && (
        <div className="relative z-20 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/50 py-2">
          <div className="container mx-auto px-4 flex justify-center items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">CA:</span>
            <span className="text-zinc-300">{settings.contract_address}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(settings.contract_address)
                toast.success('CA copied to clipboard')
              }}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {tickerData.length > 0 && (
          <div className="border-b border-zinc-800/50 bg-black/40 backdrop-blur-sm overflow-hidden">
            <motion.div
              animate={{ x: [0, -2000] }}
              transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
              className="flex gap-12 whitespace-nowrap text-xs py-3 font-mono"
            >
              {tickerData.map((item, i) => (
                <div key={i} className="flex items-center gap-8">
                  <span className="text-zinc-500">
                    <span className={item.color}>
                      {item.wallet}
                    </span>
                    {' → '}
                    <span className="text-white">
                      {item.pair}
                    </span>
                    {' '}
                    <span className={parseFloat(item.change) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {parseFloat(item.change) >= 0 ? '+' : ''}{item.change}%
                    </span>
                  </span>
                  <span className="text-zinc-700">•</span>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        <div className={clsx("p-6 space-y-6", !user && "blur-md pointer-events-none")}>
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight font-mono text-center sm:text-left">LOBSTER BATTLES ARENA</h1>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-red-950/20 to-zinc-900 border-red-800/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">{CLAUDE_A.name} PnL</p>
                      <p className={clsx(
                        "text-2xl font-bold font-mono",
                        statsA.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {statsA.pnl >= 0 ? '+' : ''}{statsA.pnl.toFixed(2)}%
                      </p>
                    </div>
                    <TrendingUp className="text-red-500/30" size={32} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">{CLAUDE_A.name} Trades</p>
                      <p className="text-2xl font-bold text-white font-mono">{statsA.trades}</p>
                    </div>
                    <Activity className="text-red-500/50" size={32} />
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="bg-gradient-to-br from-purple-950/20 to-zinc-900 border-purple-800/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">{CLAUDE_B.name} PnL</p>
                      <p className={clsx(
                        "text-2xl font-bold font-mono",
                        statsB.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {statsB.pnl >= 0 ? '+' : ''}{statsB.pnl.toFixed(2)}%
                      </p>
                    </div>
                    <TrendingDown className="text-purple-500/30" size={32} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase mb-1">{CLAUDE_B.name} Trades</p>
                      <p className="text-2xl font-bold text-white font-mono">{statsB.trades}</p>
                    </div>
                    <Activity className="text-purple-500/50" size={32} />
                  </div>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-900/50 border-zinc-800 p-6">
                  <div className="hidden md:grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={clsx(
                        "relative p-6 rounded-xl border-2 cursor-pointer transition-all",
                        selectedSide === 'A'
                          ? "border-red-500 bg-red-950/20"
                          : "border-zinc-800 bg-zinc-900/30 hover:border-red-600/50"
                      )}
                      onClick={() => setSelectedSide('A')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CLAUDE_A.color} flex items-center justify-center shadow-lg overflow-hidden`}>
                          <img src={CLAUDE_A.image} alt={CLAUDE_A.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg font-mono">{CLAUDE_A.name}</h3>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">PnL</span>
                          <span className={clsx(
                            "font-mono font-bold",
                            statsA.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {statsA.pnl >= 0 ? '+' : ''}{statsA.pnl.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">24h Trades</span>
                          <span className="text-white font-mono">{statsA.trades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Tokens Held</span>
                          <span className="text-white font-mono">{statsA.tokens.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Portfolio Value</span>
                          <span className="text-white font-mono">${statsA.totalValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Odds</span>
                          <span className="text-red-400 font-bold">{oddsA.toFixed(2)}x</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={clsx(
                        "relative p-6 rounded-xl border-2 cursor-pointer transition-all",
                        selectedSide === 'B'
                          ? "border-purple-500 bg-purple-950/20"
                          : "border-zinc-800 bg-zinc-900/30 hover:border-purple-600/50"
                      )}
                      onClick={() => setSelectedSide('B')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CLAUDE_B.color} flex items-center justify-center shadow-lg overflow-hidden`}>
                          <img src={CLAUDE_B.image} alt={CLAUDE_B.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg font-mono">{CLAUDE_B.name}</h3>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">PnL</span>
                          <span className={clsx(
                            "font-mono font-bold",
                            statsB.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {statsB.pnl >= 0 ? '+' : ''}{statsB.pnl.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">24h Trades</span>
                          <span className="text-white font-mono">{statsB.trades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Tokens Held</span>
                          <span className="text-white font-mono">{statsB.tokens.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Portfolio Value</span>
                          <span className="text-white font-mono">${statsB.totalValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500">Odds</span>
                          <span className="text-purple-400 font-bold">{oddsB.toFixed(2)}x</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Mobile Tabs View */}
                  <div className="md:hidden mb-6">
                    <Tabs defaultValue="sonnet" className="w-full" onValueChange={(val) => setSelectedSide(val === 'sonnet' ? 'A' : 'B')}>
                      <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800 mb-4">
                        <TabsTrigger
                          value="sonnet"
                          className="data-[state=active]:bg-red-950/30 data-[state=active]:text-red-400"
                          onClick={() => setSelectedSide('A')}
                        >
                          {CLAUDE_A.name}
                        </TabsTrigger>
                        <TabsTrigger
                          value="opus"
                          className="data-[state=active]:bg-purple-950/30 data-[state=active]:text-purple-400"
                          onClick={() => setSelectedSide('B')}
                        >
                          {CLAUDE_B.name}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="sonnet" className="mt-0">
                        <div className={clsx(
                          "p-4 rounded-xl border-2 transition-all",
                          selectedSide === 'A'
                            ? "border-red-500 bg-red-950/20"
                            : "border-zinc-800 bg-zinc-900/30"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-white text-lg font-mono">{CLAUDE_A.name}</h3>
                            </div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${CLAUDE_A.color} flex items-center justify-center shadow-lg overflow-hidden`}>
                              <img src={CLAUDE_A.image} alt={CLAUDE_A.name} className="w-full h-full object-cover" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-zinc-500">PnL</span>
                              <span className={clsx(
                                "font-mono font-bold text-lg",
                                statsA.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                {statsA.pnl >= 0 ? '+' : ''}{statsA.pnl.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-xs text-zinc-500 shrink-0">Portfolio Value</span>
                              <span className="text-white font-mono font-bold truncate">${statsA.totalValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-500">24h Trades</span>
                              <span className="text-white font-mono">{statsA.trades}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-500">Tokens Held</span>
                              <span className="text-white font-mono">{statsA.tokens.length}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-xs text-zinc-500">Current Odds</span>
                              <span className="text-red-400 font-bold text-lg">{oddsA.toFixed(2)}x</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="opus" className="mt-0">
                        <div className={clsx(
                          "p-4 rounded-xl border-2 transition-all",
                          selectedSide === 'B'
                            ? "border-purple-500 bg-purple-950/20"
                            : "border-zinc-800 bg-zinc-900/30"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-white text-lg font-mono">{CLAUDE_B.name}</h3>
                            </div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${CLAUDE_B.color} flex items-center justify-center shadow-lg overflow-hidden`}>
                              <img src={CLAUDE_B.image} alt={CLAUDE_B.name} className="w-full h-full object-cover" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-zinc-500">PnL</span>
                              <span className={clsx(
                                "font-mono font-bold text-lg",
                                statsB.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                {statsB.pnl >= 0 ? '+' : ''}{statsB.pnl.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-xs text-zinc-500 shrink-0">Portfolio Value</span>
                              <span className="text-white font-mono font-bold truncate">${statsB.totalValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-500">24h Trades</span>
                              <span className="text-white font-mono">{statsB.trades}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-500">Tokens Held</span>
                              <span className="text-white font-mono">{statsB.tokens.length}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-xs text-zinc-500">Current Odds</span>
                              <span className="text-purple-400 font-bold text-lg">{oddsB.toFixed(2)}x</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="relative h-4 bg-zinc-900 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(poolA / totalPool) * 100}%` }}
                    />
                    <motion.div
                      className="absolute right-0 top-0 h-full bg-gradient-to-l from-purple-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(poolB / totalPool) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>${poolA.toLocaleString()} Pool A</span>
                    <span>${poolB.toLocaleString()} Pool B</span>
                  </div>
                </Card>

                {/* Betting Card - Mobile Only */}
                <div className="block lg:hidden">
                  <Card className="bg-gradient-to-br from-emerald-950/20 to-zinc-900 border-emerald-800/50 p-6 mb-6">
                    <h3 className="font-bold text-emerald-400 mb-2 text-sm uppercase tracking-wide">Current Leader</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-lg">
                          {statsA.pnl > statsB.pnl ? CLAUDE_A.name : CLAUDE_B.name}
                        </p>
                        <p className="text-zinc-500 text-xs">{Math.max(statsA.trades, statsB.trades)} on-chain txs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-2xl font-mono">
                          +{Math.max(statsA.pnl, statsB.pnl).toFixed(2)}%
                        </p>
                        <p className="text-zinc-500 text-xs">PnL</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="block lg:hidden">
                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Target size={20} className="text-primary" />
                      Place Your Bet
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Betting On</label>
                        <div className={clsx(
                          "p-3 rounded-lg border-2",
                          selectedSide === 'A'
                            ? "border-red-500 bg-red-950/20"
                            : "border-purple-500 bg-purple-950/20"
                        )}>
                          <div className="flex items-center gap-2">
                            {selectedSide === 'A' ? (
                              <img src={CLAUDE_A.image} alt={CLAUDE_A.name} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <img src={CLAUDE_B.image} alt={CLAUDE_B.name} className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="font-bold text-white font-mono text-sm">
                              {selectedSide === 'A' ? CLAUDE_A.name : CLAUDE_B.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm text-zinc-400">Amount (SOL)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-mono">
                              {userBalance.toFixed(4)} SOL
                            </span>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (user?.walletAddress) {
                                  setShowDepositDialog(true)
                                } else {
                                  setShowAuthDialog(true)
                                }
                              }}
                              className="h-6 text-[10px] px-2 bg-red-600 hover:bg-red-500 text-white border-none"
                            >
                              DEPOSIT
                            </Button>
                          </div>
                        </div>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-white font-mono text-lg h-12"
                        />
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1"
                            onClick={() => setBetAmount((userBalance * 0.25).toFixed(4))}
                          >
                            25%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1"
                            onClick={() => setBetAmount((userBalance * 0.5).toFixed(4))}
                          >
                            50%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1"
                            onClick={() => setBetAmount((userBalance * 0.75).toFixed(4))}
                          >
                            75%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs flex-1"
                            onClick={() => setBetAmount(userBalance.toFixed(4))}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Potential Return</span>
                          <span className="text-white font-mono">
                            {betAmount ? (parseFloat(betAmount) * (selectedSide === 'A' ? oddsA : oddsB)).toFixed(2) : '0.00'} SOL
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Current Odds <span className="text-[10px] opacity-70">(Daily PnL)</span></span>
                          <span className="text-primary font-bold">
                            {(selectedSide === 'A' ? oddsA : oddsB).toFixed(2)}x
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold"
                        disabled={!betAmount || parseFloat(betAmount) <= 0}
                        onClick={placeBet}
                      >
                        Place Bet
                      </Button>

                      <p className="text-xs text-center text-zinc-500 mt-2">
                        Bets are locked once the battle starts
                      </p>
                    </div>
                  </Card>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800 p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-primary" />
                    Performance Comparison
                  </h3>
                  <div className="h-64 bg-zinc-950/50 rounded-lg border border-zinc-800 overflow-hidden">
                    <AIComparisonChart dataA={chartDataA} dataB={chartDataB} nameA={CLAUDE_A.name} nameB={CLAUDE_B.name} />
                  </div>
                </Card>

                <TokenActivityFeed
                  transactions={txStream}
                />
              </div>

              <div className="space-y-6 hidden lg:block">
                <Card className="bg-gradient-to-br from-emerald-950/20 to-zinc-900 border-emerald-800/50 p-6">
                  <h3 className="font-bold text-emerald-400 mb-2 text-sm uppercase tracking-wide">Current Leader</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">
                        {statsA.pnl > statsB.pnl ? CLAUDE_A.name : CLAUDE_B.name}
                      </p>
                      <p className="text-zinc-500 text-xs">{Math.max(statsA.trades, statsB.trades)} on-chain txs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-2xl font-mono">
                        +{Math.max(statsA.pnl, statsB.pnl).toFixed(2)}%
                      </p>
                      <p className="text-zinc-500 text-xs">PnL</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Target size={20} className="text-primary" />
                    Place Your Bet
                  </h3>

                  {!selectedSide ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-sm">Select an AI trader to continue</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Betting On</label>
                        <div className={clsx(
                          "p-3 rounded-lg border-2",
                          selectedSide === 'A'
                            ? "border-red-500 bg-red-950/20"
                            : "border-purple-500 bg-purple-950/20"
                        )}>
                          <div className="flex items-center gap-2">
                            {selectedSide === 'A' ? (
                              <img src={CLAUDE_A.image} alt={CLAUDE_A.name} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <img src={CLAUDE_B.image} alt={CLAUDE_B.name} className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="font-bold text-white font-mono">
                              {selectedSide === 'A' ? CLAUDE_A.name : CLAUDE_B.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm text-zinc-400">Amount (SOL)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 font-mono">
                              Balance: {userBalance.toFixed(4)} SOL
                            </span>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (user?.walletAddress) {
                                  setShowDepositDialog(true)
                                } else {
                                  setShowAuthDialog(true)
                                }
                              }}
                              className="h-6 text-[10px] px-2 bg-red-600 hover:bg-red-500 text-white border-none"
                            >
                              DEPOSIT
                            </Button>
                          </div>
                        </div>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-white font-mono text-lg h-12"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setBetAmount((userBalance * 0.25).toFixed(4))}
                          >
                            25%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setBetAmount((userBalance * 0.5).toFixed(4))}
                          >
                            50%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setBetAmount((userBalance * 0.75).toFixed(4))}
                          >
                            75%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setBetAmount(userBalance.toFixed(4))}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Potential Return</span>
                          <span className="text-white font-mono">
                            {betAmount ? (parseFloat(betAmount) * (selectedSide === 'A' ? oddsA : oddsB)).toFixed(2) : '0.00'} SOL
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Current Odds <span className="text-[10px] opacity-70">(Daily PnL)</span></span>
                          <span className="text-primary font-bold">
                            {(selectedSide === 'A' ? oddsA : oddsB).toFixed(2)}x
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold"
                        disabled={!betAmount || parseFloat(betAmount) <= 0}
                        onClick={placeBet}
                      >
                        Place Bet
                      </Button>

                      <p className="text-xs text-center text-zinc-500 mt-2">
                        Bets are locked once the battle starts
                      </p>
                    </div>
                  )}
                </Card>

                {recentBets.length > 0 && (
                  <Card className="bg-zinc-900/50 border-zinc-800 p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Activity size={20} className="text-primary" />
                      Recent Bets
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentBets.map((bet, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 bg-zinc-950/50 rounded border border-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${bet.side === 'A' ? 'bg-red-500' : 'bg-purple-500'}`} />
                            <span className="text-xs text-zinc-400">{bet.user}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white font-mono">{bet.amount} SOL</span>
                            <span className="text-xs text-zinc-600">{bet.time}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit SOL</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send SOL to your wallet address to place bets.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={user?.walletAddress || ''}
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              className="px-3"
              onClick={() => {
                if (user?.walletAddress) {
                  navigator.clipboard.writeText(user.walletAddress)
                  toast.success('Address copied!')
                }
              }}
            >
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog
        open={showAuthDialog && !user}
        onOpenChange={(open) => {
          if (!user) {
            setShowAuthDialog(open)
          }
        }}
      />
    </div>
  )
}

