import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { matches, wallets, matchStats } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [activeMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'LIVE'))
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!activeMatch) {
      return NextResponse.json({
        walletA: { address: '', balance: 0, totalValue: 0, tokens: [], trades: 0, trades24h: 0, pnl: 0, volume: 0, winRate: 0, activities: [], txs: [] },
        walletB: { address: '', balance: 0, totalValue: 0, tokens: [], trades: 0, trades24h: 0, pnl: 0, volume: 0, winRate: 0, activities: [], txs: [] }
      })
    }

    const [walletA] = await db.select().from(wallets).where(eq(wallets.id, activeMatch.walletAId))
    const [walletB] = await db.select().from(wallets).where(eq(wallets.id, activeMatch.walletBId))
    const [stats] = await db.select().from(matchStats).where(eq(matchStats.matchId, activeMatch.id))

    if (!walletA || !walletB) {
      return NextResponse.json({
        walletA: { address: '', balance: 0, totalValue: 0, tokens: [], trades: 0, trades24h: 0, pnl: 0, volume: 0, winRate: 0, activities: [], txs: [] },
        walletB: { address: '', balance: 0, totalValue: 0, tokens: [], trades: 0, trades24h: 0, pnl: 0, volume: 0, winRate: 0, activities: [], txs: [] }
      })
    }

    if (!stats) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/battle/sync`, {
        method: 'POST'
      }).catch(err => console.error('Failed to trigger sync:', err))

      return NextResponse.json({
        walletA: {
          address: walletA.address,
          balance: (activeMatch.initialBalanceA || 0) / 1e9,
          totalValue: (activeMatch.initialBalanceA || 0) / 1e9,
          tokens: [],
          trades: 0,
          trades24h: 0,
          pnl: 0,
          volume: 0,
          winRate: 0,
          activities: [],
          txs: []
        },
        walletB: {
          address: walletB.address,
          balance: (activeMatch.initialBalanceB || 0) / 1e9,
          totalValue: (activeMatch.initialBalanceB || 0) / 1e9,
          tokens: [],
          trades: 0,
          trades24h: 0,
          pnl: 0,
          volume: 0,
          winRate: 0,
          activities: [],
          txs: []
        }
      })
    }

    const result = {
      matchId: activeMatch.id,
      walletA: {
        address: walletA.address,
        balance: stats.currentBalanceA / 1e9,
        totalValue: stats.currentPortfolioValueA,
        tokens: Array(stats.tokenCountA).fill({ mint: 'Token', balance: 0 }),
        trades: stats.totalTradesA,
        trades24h: stats.trades24hA,
        pnl: stats.pnlA,
        dailyPnl: stats.dailyPnlA || 0,
        volume: stats.volumeA,
        winRate: stats.winRateA,
        activities: [],
        txs: []
      },
      walletB: {
        address: walletB.address,
        balance: stats.currentBalanceB / 1e9,
        totalValue: stats.currentPortfolioValueB,
        tokens: Array(stats.tokenCountB).fill({ mint: 'Token', balance: 0 }),
        trades: stats.totalTradesB,
        trades24h: stats.trades24hB,
        pnl: stats.pnlB,
        dailyPnl: stats.dailyPnlB || 0,
        volume: stats.volumeB,
        winRate: stats.winRateB,
        activities: [],
        txs: []
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching battle stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
