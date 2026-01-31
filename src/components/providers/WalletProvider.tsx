'use client'

import { useMemo } from 'react'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta') as WalletAdapterNetwork
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    }
    return clusterApiUrl(network)
  }, [network])

  return (
    <ConnectionProvider endpoint={endpoint}>
          {children}
    </ConnectionProvider>
  )
}
