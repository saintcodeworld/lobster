'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function WalletButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button className="w-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 backdrop-blur-sm transition-all">
        Connect Wallet
      </Button>
    )
  }

  return (
    <WalletMultiButton />
  )
}

export function ConnectedWalletInfo() {
  const { publicKey, disconnect } = useWallet()
  
  if (!publicKey) return null

  return (
    <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Connected</span>
        <span className="font-mono text-xs text-white">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={disconnect}
        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      </Button>
    </div>
  )
}
