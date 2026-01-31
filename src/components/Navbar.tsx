'use client'

import Link from 'next/link'
import { WalletButton } from './WalletButton'

export function Navbar() {
  return (
    <nav className="border-b border-purple-900/20 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent glow">
              2WALLETS
            </div>
            <div className="text-xs text-purple-400 font-mono">DEGEN ARENA</div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/arena" 
              className="text-gray-300 hover:text-purple-400 transition-colors font-semibold"
            >
              Arena
            </Link>
            <Link 
              href="/leaderboard" 
              className="text-gray-300 hover:text-purple-400 transition-colors font-semibold"
            >
              Leaderboard
            </Link>
            <Link 
              href="/portfolio" 
              className="text-gray-300 hover:text-purple-400 transition-colors font-semibold"
            >
              Portfolio
            </Link>
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
