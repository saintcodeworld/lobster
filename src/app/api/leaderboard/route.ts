import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wallets } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { cache } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'pnlPct'
    const chain = searchParams.get('chain')
    const limit = parseInt(searchParams.get('limit') || '50')

    const cacheKey = `leaderboard:${sortBy}:${chain}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    let query = db.select().from(wallets).$dynamic()

    if (chain) {
      query = query.where(eq(wallets.chain, chain))
    }

    if (sortBy === 'pnlPct') {
      query = query.orderBy(desc(wallets.pnlPct))
    } else if (sortBy === 'winRate') {
      query = query.orderBy(desc(wallets.winRate))
    } else if (sortBy === 'sharpe') {
      query = query.orderBy(desc(wallets.sharpeApprox))
    } else {
      query = query.orderBy(desc(wallets.pnlUsd))
    }

    const walletsData = await query.limit(limit)

    const leaderboard = walletsData.map((wallet, index) => ({
      ...wallet,
      rank: index + 1,
    }))

    const result = { leaderboard }
    await cache.set(cacheKey, result, 30)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
