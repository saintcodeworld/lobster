'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Terminal, DollarSign, TrendingUp, Users, ArrowUpRight, CheckCircle2, Swords } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const ADMIN_PASSWORD = 'admin123' // TODO: Move to env

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    const stored = sessionStorage.getItem('admin-auth')
    if (stored === 'true') setIsAuthenticated(true)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin-auth', 'true')
      toast.success('Admin authenticated')
    } else {
      toast.error('Invalid password')
    }
  }

  const { data: allBets, isLoading } = useQuery({
    queryKey: ['admin-bets'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bets')
      return res.json()
    },
    enabled: isAuthenticated,
    refetchInterval: 5000,
  })

  const { data: treasuryBalance } = useQuery({
    queryKey: ['treasury-balance'],
    queryFn: async () => {
      const res = await fetch('/api/admin/treasury')
      return res.json()
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
  })

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      return res.json()
    },
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (settings?.contract_address) {
      const el = document.getElementById('contractAddress') as HTMLInputElement
      if (el) el.value = settings.contract_address
    }
  }, [settings])

  const [walletA, setWalletA] = useState('')
  const [walletB, setWalletB] = useState('')
  const [previewData, setPreviewData] = useState<any>(null)

  const previewBattleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/battle/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAAddress: walletA, walletBAddress: walletB }),
      })
      if (!res.ok) throw new Error('Failed to fetch data')
      return res.json()
    },
    onSuccess: (data) => {
      setPreviewData(data)
      toast.success('Data fetched successfully!')
    },
    onError: (error: any) => {
      toast.error(`Fetch failed: ${error.message}`)
      setPreviewData(null)
    },
  })

  const deployBattleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAAddress: walletA, walletBAddress: walletB }),
      })
      if (!res.ok) throw new Error('Failed to deploy battle')
      const data = await res.json()
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const syncRes = await fetch('/api/admin/battle/sync', { method: 'POST' })
      if (!syncRes.ok) console.error('Sync failed')
      
      return data
    },
    onSuccess: () => {
      toast.success('Battle deployed and synced successfully!')
      setWalletA('')
      setWalletB('')
      setPreviewData(null)
      queryClient.invalidateQueries()
    },
    onError: (error: any) => {
      toast.error(`Deploy failed: ${error.message}`)
    },
  })

  const syncBattleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/battle/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to sync')
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Battle data synced!')
      queryClient.invalidateQueries()
    },
    onError: (error: any) => {
      toast.error(`Sync failed: ${error.message}`)
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="terminal-card p-12 w-full max-w-md bg-zinc-950">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Terminal size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">ADMIN ACCESS</h1>
            <p className="text-zinc-500 text-sm font-mono">RESTRICTED AREA</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-500 mb-2 block">PASSWORD</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="terminal-input h-12"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-primary text-black font-bold rounded-none">
              AUTHENTICATE
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  const bets = allBets?.bets || []
  const stats = {
    totalBets: bets.length,
    totalVolume: bets.reduce((sum: number, b: any) => sum + b.amount, 0),
    pendingBets: bets.filter((b: any) => b.status === 'PENDING').length,
    settledBets: bets.filter((b: any) => b.status === 'SETTLED').length,
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-12 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Terminal className="text-primary" />
            ADMIN PANEL
          </h1>
          <p className="text-zinc-500 font-mono text-sm">SYSTEM CONTROL CENTER</p>
        </div>
        <Button 
          onClick={() => {
            setIsAuthenticated(false)
            sessionStorage.removeItem('admin-auth')
          }}
          variant="outline"
          className="border-zinc-700 rounded-none"
        >
          LOGOUT
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card className="terminal-card p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-primary" size={24} />
            <ArrowUpRight className="text-zinc-700" size={16} />
          </div>
          <div className="text-xs font-mono text-zinc-500 mb-1">TREASURY BALANCE</div>
          <div className="text-3xl font-mono font-bold text-white">
            {treasuryBalance?.balance?.toFixed(2) || '0.00'} SOL
          </div>
        </Card>

        <Card className="terminal-card p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-secondary" size={24} />
          </div>
          <div className="text-xs font-mono text-zinc-500 mb-1">TOTAL VOLUME</div>
          <div className="text-3xl font-mono font-bold text-white">
            {stats.totalVolume.toFixed(2)} SOL
          </div>
        </Card>

        <Card className="terminal-card p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-yellow-500" size={24} />
          </div>
          <div className="text-xs font-mono text-zinc-500 mb-1">PENDING BETS</div>
          <div className="text-3xl font-mono font-bold text-white">
            {stats.pendingBets}
          </div>
        </Card>

        <Card className="terminal-card p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="text-primary" size={24} />
          </div>
          <div className="text-xs font-mono text-zinc-500 mb-1">SETTLED BETS</div>
          <div className="text-3xl font-mono font-bold text-white">
            {stats.settledBets}
          </div>
        </Card>
      </div>

      {/* Battle Configuration */}
      <Card className="terminal-card p-6 bg-zinc-950 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Swords className="text-red-500" />
            BATTLE CONFIGURATION
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">CLAUDE SONNET WALLET (ALPHA)</label>
            <Input
              value={walletA}
              onChange={(e) => {
                setWalletA(e.target.value)
                setPreviewData(null)
              }}
              className="terminal-input bg-zinc-900 border-zinc-800 font-mono text-xs"
              placeholder="Enter Solana Address..."
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">CLAUDE OPUS WALLET (BETA)</label>
            <Input
              value={walletB}
              onChange={(e) => {
                setWalletB(e.target.value)
                setPreviewData(null)
              }}
              className="terminal-input bg-zinc-900 border-zinc-800 font-mono text-xs"
              placeholder="Enter Solana Address..."
            />
          </div>
        </div>

        {previewData && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-900/50 border border-zinc-800">
            <div className="space-y-3">
              <div className="text-sm font-mono text-cyan-400 mb-4">WALLET A - STARTING STATE</div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">SOL Balance:</span>
                <span className="text-white font-mono">{previewData.walletA.solBalance.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Tokens Value:</span>
                <span className="text-white font-mono">${previewData.walletA.tokensValueUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-zinc-700 pt-2 mt-2">
                <span className="text-zinc-400">Total Portfolio:</span>
                <span className="text-cyan-400 font-mono">${previewData.walletA.portfolioValueUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Activity 24h:</span>
                <span className="text-white font-mono">{previewData.walletA.trades24h} txs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Activity 7d:</span>
                <span className="text-white font-mono">{previewData.walletA.trades7d} txs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Success Rate:</span>
                <span className="text-white font-mono">{previewData.walletA.txSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs border-t border-zinc-800 pt-3 mt-3">
                <span className="text-zinc-500">Status:</span>
                <div className="flex gap-2">
                  <Badge className={previewData.walletA.isValid ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {previewData.walletA.isValid ? 'VALID' : 'INVALID'}
                  </Badge>
                  <Badge className={previewData.walletA.isActive ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-800 text-zinc-500'}>
                    {previewData.walletA.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-mono text-purple-400 mb-4">WALLET B - STARTING STATE</div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">SOL Balance:</span>
                <span className="text-white font-mono">{previewData.walletB.solBalance.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Tokens Value:</span>
                <span className="text-white font-mono">${previewData.walletB.tokensValueUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-zinc-700 pt-2 mt-2">
                <span className="text-zinc-400">Total Portfolio:</span>
                <span className="text-purple-400 font-mono">${previewData.walletB.portfolioValueUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Activity 24h:</span>
                <span className="text-white font-mono">{previewData.walletB.trades24h} txs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Activity 7d:</span>
                <span className="text-white font-mono">{previewData.walletB.trades7d} txs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Success Rate:</span>
                <span className="text-white font-mono">{previewData.walletB.txSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs border-t border-zinc-800 pt-3 mt-3">
                <span className="text-zinc-500">Status:</span>
                <div className="flex gap-2">
                  <Badge className={previewData.walletB.isValid ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {previewData.walletB.isValid ? 'VALID' : 'INVALID'}
                  </Badge>
                  <Badge className={previewData.walletB.isActive ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-800 text-zinc-500'}>
                    {previewData.walletB.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => previewBattleMutation.mutate()}
            disabled={!walletA || !walletB || previewBattleMutation.isPending}
            className="bg-blue-900/20 text-blue-400 border border-blue-900/50 hover:bg-blue-900/40 rounded-none font-mono"
          >
            {previewBattleMutation.isPending ? 'FETCHING...' : '1. FETCH DATA'}
          </Button>
        <Button 
            onClick={() => deployBattleMutation.mutate()}
            disabled={!previewData || !previewData.walletA.isValid || !previewData.walletB.isValid || deployBattleMutation.isPending}
            className="bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-none font-mono"
        >
            {deployBattleMutation.isPending ? 'DEPLOYING...' : '2. DEPLOY BATTLE'}
        </Button>
        </div>
      </Card>

      {/* Recent Bets Table */}
      <div className="border border-zinc-800 bg-zinc-950">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-mono">RECENT TRANSACTIONS</h2>
          <Badge variant="outline" className="border-primary text-primary font-mono text-xs">
            LIVE UPDATES
          </Badge>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {isLoading ? (
            <div className="p-6 text-center text-zinc-500">Loading...</div>
          ) : bets.length > 0 ? (
            bets.slice(0, 20).map((bet: any) => (
              <div key={bet.id} className="p-4 hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Badge className={`${
                      bet.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      bet.status === 'SETTLED' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-zinc-800 text-zinc-500'
                    } text-[10px] uppercase tracking-wider rounded-none`}>
                      {bet.status}
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono text-white mb-1">
                        Match #{bet.matchId.slice(0, 8)} - Side {bet.side}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono truncate">
                        User: {bet.userId.slice(0, 8)}... • {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-white">
                      {bet.amount} SOL
                    </div>
                    {bet.txSignature && (
                      <a 
                        href={`https://solscan.io/tx/${bet.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-mono"
                      >
                        VIEW TX
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-zinc-500">No bets yet</div>
          )}
        </div>
      </div>

      {/* Pool Management */}
      <Card className="terminal-card p-6 bg-zinc-950 mb-12">
        <h2 className="text-xl font-bold text-white mb-6">BET POOL MANAGEMENT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">POOL A (SOL)</label>
            <Input
              type="number"
              placeholder="0.00"
              className="terminal-input bg-zinc-900 border-zinc-800 font-mono"
              id="poolA"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">POOL B (SOL)</label>
            <Input
              type="number"
              placeholder="0.00"
              className="terminal-input bg-zinc-900 border-zinc-800 font-mono"
              id="poolB"
            />
          </div>
        </div>
        <Button 
          onClick={() => {
            const poolAInput = (document.getElementById('poolA') as HTMLInputElement).value
            const poolBInput = (document.getElementById('poolB') as HTMLInputElement).value
            
            fetch('/api/admin/pools', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                poolA: parseFloat(poolAInput), 
                poolB: parseFloat(poolBInput) 
              })
            }).then(() => {
              toast.success('Pools updated!')
              queryClient.invalidateQueries()
            }).catch(() => toast.error('Failed to update pools'))
          }}
          className="mt-6 w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-none font-mono"
        >
          UPDATE POOLS
        </Button>
      </Card>

      {/* Settings Management */}
      <Card className="terminal-card p-6 bg-zinc-950 mb-12">
        <h2 className="text-xl font-bold text-white mb-6">SYSTEM SETTINGS</h2>
        <div className="grid md:grid-cols-1 gap-6">
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">CONTRACT ADDRESS (CA)</label>
            <Input
              type="text"
              placeholder="Enter Contract Address..."
              className="terminal-input bg-zinc-900 border-zinc-800 font-mono"
              id="contractAddress"
            />
          </div>
        </div>
        <Button 
          onClick={() => {
            const caInput = (document.getElementById('contractAddress') as HTMLInputElement).value
            
            fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                key: 'contract_address',
                value: caInput
              })
            }).then(() => {
              toast.success('Settings updated!')
              queryClient.invalidateQueries()
            }).catch(() => toast.error('Failed to update settings'))
          }}
          className="mt-6 w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-none font-mono"
        >
          UPDATE SETTINGS
        </Button>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => syncBattleMutation.mutate()}
          disabled={syncBattleMutation.isPending}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-none"
        >
          {syncBattleMutation.isPending ? 'SYNCING...' : 'SYNC BATTLE DATA'}
        </Button>
        <Button 
          onClick={() => queryClient.invalidateQueries()}
          variant="outline"
          className="border-zinc-700 rounded-none"
        >
          REFRESH DATA
        </Button>
      </div>
    </div>
  )
}
