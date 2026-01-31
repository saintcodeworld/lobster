'use client'

import { useState, useEffect, useRef } from 'react'

interface Transaction {
  signature: string
  timestamp: number
  type: string
  source: string
  description: string
  tokenSymbol?: string
}

const WS_URL = 'wss://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'

export function useTransactionStream(walletAAddress: string, walletBAddress: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const seenSignaturesRef = useRef<Set<string>>(new Set<string>())
  const lastUpdateRef = useRef<number>(0)
  const messageCountRef = useRef<number>(0)

  useEffect(() => {
    if (!walletAAddress || !walletBAddress) return

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws
      
      let subscriptionIdA: number | null = null
      let subscriptionIdB: number | null = null

      ws.onopen = () => {
        console.log('Transaction stream connected')
        
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'sub-a',
          method: 'logsSubscribe',
          params: [
            { mentions: [walletAAddress] },
            { commitment: 'confirmed' }
          ]
        }))

        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 'sub-b',
          method: 'logsSubscribe',
          params: [
            { mentions: [walletBAddress] },
            { commitment: 'confirmed' }
          ]
        }))
      }

      ws.onmessage = (event) => {
        try {
          messageCountRef.current++
          
          if (messageCountRef.current % 100 === 0) {
            console.log(`📊 Received ${messageCountRef.current} WebSocket messages`)
          }
          
          const message = JSON.parse(event.data)
          
          if (message.result && message.id) {
            if (message.id === 'sub-a') {
              subscriptionIdA = message.result
              console.log('✅ Subscribed to Wallet A:', subscriptionIdA)
            } else if (message.id === 'sub-b') {
              subscriptionIdB = message.result
              console.log('✅ Subscribed to Wallet B:', subscriptionIdB)
            }
            return
          }
          
          if (message.params?.result?.value) {
            const result = message.params.result.value
            const signature = result.signature
            const logs = result.logs || []
            const err = result.err
            
            if (seenSignaturesRef.current.has(signature)) {
              return
            }
            
            if (err) {
              return
            }
            
            const isTokenProgram = logs.some((log: string) => 
              log.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            )
            
            if (!isTokenProgram) {
              return
            }
            
            const now = Date.now()
            if (now - lastUpdateRef.current < 3000) {
              return
            }
            
            lastUpdateRef.current = now
            processTransaction(signature, logs, message.params.subscription === subscriptionIdA)
          }
        } catch (error) {
          console.error('Error parsing transaction:', error)
        }
      }

      const processTransaction = (signature: string, logs: string[], isWalletA: boolean) => {
        if (seenSignaturesRef.current.has(signature)) return
        seenSignaturesRef.current.add(signature)
        
        const logsStr = logs.join(' ')
        
        let tokenSymbol = 'TOKEN'
        const tokenMap: Record<string, string> = {
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
          'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
          'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
          'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
          'So11111111111111111111111111111111111111112': 'wSOL',
          '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
          '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh': 'BTC',
          'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JTO',
          'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': 'WEN',
        }
        
        for (const [mint, symbol] of Object.entries(tokenMap)) {
          if (logsStr.includes(mint)) {
            tokenSymbol = symbol
            break
          }
        }
        
        if (tokenSymbol === 'TOKEN') {
          const mintMatch = logsStr.match(/([A-HJ-NP-Za-km-z1-9]{43,44})/)
          if (mintMatch) {
            tokenSymbol = mintMatch[1].slice(0, 4).toUpperCase()
          }
        }
        
        const newTx: Transaction = {
          signature,
          timestamp: Date.now(),
          type: 'trade',
          source: isWalletA ? 'A' : 'B',
          description: `${tokenSymbol} Trade`,
          tokenSymbol
        }
        
        setTransactions(prev => {
          if (prev.some(t => t.signature === signature)) return prev
          const updated = [newTx, ...prev.slice(0, 9)]
          return updated
        })
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('Transaction stream disconnected, reconnecting...')
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [walletAAddress, walletBAddress])

  return transactions
}
