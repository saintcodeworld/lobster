'use client'

import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Activity as ActivityIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface Transaction {
  signature: string
  timestamp: number
  type: string
  source: string
  description: string
  tokenSymbol?: string
}

interface TokenActivityFeedProps {
  transactions: Transaction[]
}

function TokenActivityFeedComponent({ transactions = [] }: TokenActivityFeedProps) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <ActivityIcon size={20} className="text-primary" />
          Live Transaction Feed
        </h3>
        <div className="text-center py-8 text-zinc-500 text-sm">
          No recent activity. Waiting for transactions...
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-6">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <ActivityIcon size={20} className="text-primary animate-pulse" />
        Live Transaction Feed
        <Badge className="bg-primary/10 text-primary border-primary/20 ml-auto">
          {transactions.length} LIVE
        </Badge>
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {transactions.map((tx) => {
            const isWalletA = tx.source === 'A'
            const timeSince = Math.floor((Date.now() - tx.timestamp) / 1000)

            return (
              <motion.div
                key={tx.signature}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isWalletA ? "bg-red-500/10" : "bg-blue-500/10"
                  )}>
                    <ActivityIcon className={clsx(
                      "w-4 h-4",
                      isWalletA ? "text-red-400" : "text-blue-400"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-sm font-bold",
                        isWalletA ? "text-red-400" : "text-blue-400"
                      )}>
                        {isWalletA ? 'Molt' : 'Blue Molt'}
                      </span>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {tx.tokenSymbol || 'TOKEN'}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {tx.description}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-primary font-mono">
                    {timeSince < 60 ? `${timeSince}s ago` : `${Math.floor(timeSince / 60)}m ago`}
                  </span>
                  <a
                    href={`https://solscan.io/tx/${tx.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-600 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    View <ExternalLink size={10} />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Card>
  )
}

export const TokenActivityFeed = memo(TokenActivityFeedComponent)
