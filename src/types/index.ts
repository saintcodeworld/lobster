// Drizzle enum types
export type MatchTimeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'SETTLED'
export type BetSide = 'A' | 'B'
export type BetStatus = 'PENDING' | 'SETTLED' | 'CANCELLED'

export interface PoolOdds {
  matchId: string
  oddsA: number
  oddsB: number
  poolA: number
  poolB: number
  totalPool: number
  impliedProbA: number
  impliedProbB: number
}

export interface WalletMetrics {
  pnlPct: number
  pnlUsd: number
  maxDrawdown: number
  volatility: number
  winRate: number
  sharpeApprox: number
  lastUpdatedAt: Date
}

export interface MatchWithDetails {
  id: string
  walletA: {
    id: string
    address: string
    label: string | null
    metrics: WalletMetrics
  }
  walletB: {
    id: string
    address: string
    label: string | null
    metrics: WalletMetrics
  }
  timeframe: MatchTimeframe
  startAt: Date
  endAt: Date
  status: MatchStatus
  betPool?: {
    poolA: number
    poolB: number
    totalPool: number
  }
}
