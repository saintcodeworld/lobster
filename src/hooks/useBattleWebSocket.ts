'use client'

import { useState, useEffect, useRef } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'

const WS_URL = 'wss://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'
const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'

interface WalletData {
  address: string
  balance: number
  totalValue: number
  tokens: any[]
  trades: number
  trades24h: number
  pnl: number
  volume: number
  activities: any[]
  txs: any[]
}

export function useBattleWebSocket(walletAAddress: string, walletBAddress: string, initialA: number, initialB: number) {
  const [dataA, setDataA] = useState<WalletData | null>(null)
  const [dataB, setDataB] = useState<WalletData | null>(null)
  const connectionRef = useRef<Connection | null>(null)
  const subscriptionsRef = useRef<{ a: number | null; b: number | null }>({ a: null, b: null })
  const initialBalancesRef = useRef({ a: initialA, b: initialB })

  useEffect(() => {
    initialBalancesRef.current = { a: initialA, b: initialB }
  }, [initialA, initialB])

  useEffect(() => {
    if (!walletAAddress || !walletBAddress) return

    if (!connectionRef.current) {
      connectionRef.current = new Connection(RPC_URL, { 
        wsEndpoint: WS_URL,
        commitment: 'confirmed'
      })
    }

    const connection = connectionRef.current
    const pubkeyA = new PublicKey(walletAAddress)
    const pubkeyB = new PublicKey(walletBAddress)

    const updateBalance = (accountInfo: { lamports: number }, isWalletA: boolean, setter: typeof setDataA) => {
      const balance = accountInfo.lamports
      const initialBalance = isWalletA ? initialBalancesRef.current.a : initialBalancesRef.current.b
        setter(prev => prev ? {
          ...prev,
          balance: balance / 1e9,
          totalValue: balance / 1e9,
        pnl: initialBalance > 0 
          ? ((balance - initialBalance) / initialBalance) * 100 
            : 0
        } : null)
    }

    subscriptionsRef.current.a = connection.onAccountChange(
      pubkeyA,
      (accountInfo) => {
        updateBalance(accountInfo, true, setDataA)
      },
      'confirmed'
    )

    subscriptionsRef.current.b = connection.onAccountChange(
      pubkeyB,
      (accountInfo) => {
        updateBalance(accountInfo, false, setDataB)
      },
      'confirmed'
    )

    return () => {
      try {
        if (subscriptionsRef.current.a !== null) {
          connection.removeAccountChangeListener(subscriptionsRef.current.a)
        }
        if (subscriptionsRef.current.b !== null) {
          connection.removeAccountChangeListener(subscriptionsRef.current.b)
        }
      } catch (e) {
        console.error('Error cleaning up:', e)
      }
    }
  }, [walletAAddress, walletBAddress])

  return { dataA, dataB, setDataA, setDataB }
}
