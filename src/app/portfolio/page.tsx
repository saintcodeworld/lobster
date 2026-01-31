'use client'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiWithFallback as api } from '@/lib/api-with-fallback'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, History, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, LogIn, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { AuthDialog } from '@/components/AuthDialog'

const StatCard = ({ title, value, subValue, trend, delay, loading }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="h-full"
  >
    <div className="p-6 h-full flex flex-col justify-between bg-zinc-900/40 border border-zinc-800/50 rounded-xl backdrop-blur-sm hover:bg-zinc-900/60 transition-colors">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-24 bg-zinc-800/50" />
          <Skeleton className="h-8 w-32 bg-zinc-800/50" />
          <Skeleton className="h-4 w-20 bg-zinc-800/50" />
        </div>
      ) : (
        <>
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
            <div className="text-2xl md:text-3xl font-mono font-medium text-white tracking-tight">{value}</div>
          </div>
          <div className={clsx(
            "text-xs mt-4 font-medium flex items-center gap-1.5",
            trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-zinc-500'
          )}>
            {trend === 'up' && <ArrowUpRight size={14} />}
            {trend === 'down' && <ArrowDownRight size={14} />}
            {subValue}
          </div>
        </>
      )}
    </div>
  </motion.div>
)

const BetCard = ({ bet }: any) => {
  if (!bet.match) return null
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between bg-zinc-900/20 border border-zinc-800/50 rounded-xl hover:border-zinc-700/50 hover:bg-zinc-900/40 transition-all cursor-default gap-4 md:gap-0">
        <div className="flex items-start md:items-center gap-4">
          <div className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-lg border shrink-0",
            bet.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
            bet.status === 'WON' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
            'bg-red-500/10 border-red-500/20 text-red-500'
          )}>
            {bet.status === 'PENDING' ? <Clock size={18} /> : 
             bet.status === 'WON' ? <TrendingUp size={18} /> : <AlertCircle size={18} />}
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-bold text-white text-base">
                {bet.match.walletA?.label || 'Wallet A'} <span className="text-zinc-600 font-normal text-xs mx-1">vs</span> {bet.match.walletB?.label || 'Wallet B'}
              </span>
              <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-400 bg-zinc-900/50 h-5 px-1.5 font-normal">
                {bet.match.timeframe}
              </Badge>
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-3 font-medium">
              <span className="flex items-center gap-1.5">
                Position: 
                <span className={clsx(
                  "font-bold",
                  bet.side === 'A' ? 'text-white' : 'text-blue-400'
                )}>
                  {bet.side === 'A' ? (bet.match.walletA?.label || 'Side A') : (bet.match.walletB?.label || 'Side B')}
                </span>
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>{formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-8 md:text-right border-t border-zinc-800/50 pt-4 md:pt-0 md:border-0 pl-14 md:pl-0">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Wager</div>
            <div className="text-base font-mono font-medium text-white">
              {bet.amount} SOL
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">
              {bet.status === 'PENDING' ? 'Potential Payout' : 'Result'}
            </div>
            <div className="text-base font-mono font-medium">
              {bet.status === 'PENDING' ? (
                <span className="text-emerald-500">{(bet.amount * bet.oddsSnapshot).toFixed(2)} SOL</span>
              ) : bet.status === 'WON' ? (
                <span className="text-emerald-500">+{bet.payoutAmount?.toFixed(2)} SOL</span>
              ) : (
                <span className="text-zinc-500 line-through">{(bet.amount * bet.oddsSnapshot).toFixed(2)} SOL</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function PortfolioPage() {
  const { user, getPublicKey } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)
  const publicKey = getPublicKey()

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

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile', publicKey?.toBase58()],
    queryFn: () => api.user.getProfile(publicKey!.toBase58()),
    enabled: !!publicKey,
    refetchInterval: 10000,
  })

  if (!user || !publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md p-10 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm"
        >
          <div className="w-20 h-20 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-700/50">
            <Wallet size={32} className="text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
            Login to view your betting portfolio, 
            track performance, and manage your assets.
          </p>
          </div>
          <div className="pt-2 flex justify-center w-full">
            <div className="w-full max-w-[200px]">
              <Button
                onClick={() => setShowAuthDialog(true)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <LogIn size={16} className="mr-2" />
                Login / Sign Up
              </Button>
            </div>
          </div>
        </motion.div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
    )
  }

  const stats = profileData?.stats || {
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    winRate: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    roi: 0,
  }

  const bets = profileData?.user?.bets || []
  const activeBets = bets.filter((bet: any) => bet.status === 'PENDING')
  const historyBets = bets.filter((bet: any) => bet.status !== 'PENDING')
    
    return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-zinc-800/50 pb-8">
          <div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Portfolio</h1>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono bg-zinc-900/50 w-fit px-3 py-1.5 rounded-full border border-zinc-800/50 hover:bg-zinc-900 transition-colors group max-w-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate md:hidden">
                {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-6)}
              </span>
              <span className="hidden md:inline truncate">
                {publicKey.toBase58()}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(publicKey.toBase58())
                  toast.success('Address copied to clipboard')
                }}
                className="ml-2 p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0"
              >
                <Copy size={12} />
              </button>
            </div>
            <div className="text-sm text-zinc-400 font-mono flex items-center gap-2">
              Balance: <span className="text-white font-bold text-lg">{userBalance.toFixed(4)} SOL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard 
          title="Net Profit" 
          value={`${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)} SOL`}
          subValue={`ROI: ${stats.roi.toFixed(1)}%`}
          trend={stats.netProfit >= 0 ? 'up' : 'down'}
          delay={0}
          loading={isLoading}
        />
        <StatCard 
          title="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`}
          subValue={`${stats.wonBets}W - ${stats.lostBets}L`}
          trend={stats.winRate > 50 ? 'up' : 'down'}
          delay={0.1}
          loading={isLoading}
        />
        <StatCard 
          title="Total Wagered" 
          value={`${stats.totalWagered.toFixed(2)} SOL`}
          subValue={`${stats.totalBets} Total Bets`}
          trend="neutral"
          delay={0.2}
          loading={isLoading}
        />
        <StatCard 
          title="Active Exposure" 
          value={`${activeBets.reduce((acc: number, b: any) => acc + b.amount, 0).toFixed(2)} SOL`}
          subValue={`${activeBets.length} Active Bets`}
          trend="neutral"
          delay={0.3}
          loading={isLoading}
        />
      </div>

      <Tabs defaultValue="active" className="space-y-8">
        <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1 rounded-lg w-fit h-auto backdrop-blur-sm">
          <TabsTrigger 
            value="active"
            className="px-6 py-2 rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-white text-xs font-medium uppercase tracking-wide transition-all gap-2 min-w-[120px]"
          >
            Active Bets
            {activeBets.length > 0 && (
              <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {activeBets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="px-6 py-2 rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-white text-xs font-medium uppercase tracking-wide transition-all gap-2 min-w-[120px]"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 min-h-[300px] focus:outline-none">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-900/20" />)}
            </div>
          ) : activeBets.length > 0 ? (
            activeBets.map((bet: any) => <BetCard key={bet.id} bet={bet} />)
          ) : (
            <div className="text-center py-32 text-zinc-500 bg-zinc-900/10 rounded-2xl border border-zinc-800/30 border-dashed">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
              <p>No active bets currently</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 focus:outline-none">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-900/20" />)}
            </div>
          ) : historyBets.length > 0 ? (
            historyBets.map((bet: any) => <BetCard key={bet.id} bet={bet} />)
          ) : (
            <div className="text-center py-32 text-zinc-500 bg-zinc-900/10 rounded-2xl border border-zinc-800/30 border-dashed">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No betting history yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
