import { PoolOdds } from '@/types'

export const calculateOdds = (
  poolA: number,
  poolB: number,
  houseFeeBps: number = 250
): PoolOdds => {
  const totalPool = poolA + poolB
  
  if (totalPool === 0) {
    return {
      matchId: '',
      oddsA: 2.0,
      oddsB: 2.0,
      poolA: 0,
      poolB: 0,
      totalPool: 0,
      impliedProbA: 0.5,
      impliedProbB: 0.5,
    }
  }

  const houseFee = (houseFeeBps / 10000) * totalPool
  const payoutPool = totalPool - houseFee

  const impliedProbA = poolA / totalPool
  const impliedProbB = poolB / totalPool

  const oddsA = poolA > 0 ? payoutPool / poolA : 2.0
  const oddsB = poolB > 0 ? payoutPool / poolB : 2.0

  return {
    matchId: '',
    oddsA: Math.max(1.01, oddsA),
    oddsB: Math.max(1.01, oddsB),
    poolA,
    poolB,
    totalPool,
    impliedProbA,
    impliedProbB,
  }
}

export const calculateOddsFromPnL = (
  pnlA: number,
  pnlB: number,
  houseEdgeBps: number = 500
): { oddsA: number; oddsB: number; impliedProbA: number; impliedProbB: number } => {
  const pnlDiff = pnlA - pnlB
  
  const minOdds = 1.10
  const maxOdds = 10.0
  
  let rawProbA: number
  let rawProbB: number
  
  if (Math.abs(pnlDiff) < 0.01) {
    rawProbA = 0.5
    rawProbB = 0.5
  } else {
    const absDiff = Math.abs(pnlDiff)
    const scaledDiff = absDiff * 2
    const clampedDiff = Math.min(scaledDiff, 0.35)
    
    if (pnlA > pnlB) {
      rawProbA = 0.5 + clampedDiff / 2
      rawProbB = 1 - rawProbA
    } else {
      rawProbB = 0.5 + clampedDiff / 2
      rawProbA = 1 - rawProbB
    }
  }
  
  const houseEdge = houseEdgeBps / 10000
  const totalImpliedProb = 1 + houseEdge
  
  const impliedProbA = (rawProbA / (rawProbA + rawProbB)) * totalImpliedProb
  const impliedProbB = (rawProbB / (rawProbB + rawProbA)) * totalImpliedProb
  
  let oddsA = 1 / impliedProbA
  let oddsB = 1 / impliedProbB
  
  oddsA = Math.max(minOdds, Math.min(maxOdds, oddsA))
  oddsB = Math.max(minOdds, Math.min(maxOdds, oddsB))
  
  return {
    oddsA,
    oddsB,
    impliedProbA,
    impliedProbB
  }
}

export const calculatePayout = (
  betAmount: number,
  odds: number
): number => {
  return betAmount * odds
}

export const formatOdds = (odds: number): string => {
  return odds.toFixed(2)
}

export const formatPnl = (pnl: number): string => {
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}${pnl.toFixed(2)}%`
}
