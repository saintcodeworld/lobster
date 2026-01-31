import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { matches, wallets, betPools } from '@/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { cache } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const cacheKey = `matches:${status}`

    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const matchesData = await db
      .select()
      .from(matches)
      .where(status !== 'ALL' ? eq(matches.status, status as any) : undefined)
      .limit(50)

    if (matchesData.length === 0) {
      const result = { matches: [] }
      await cache.set(cacheKey, result, 30)
      return NextResponse.json(result)
    }

    const walletIds = [...new Set([
      ...matchesData.map(m => m.walletAId),
      ...matchesData.map(m => m.walletBId),
    ])].filter(Boolean)

    const matchIds = matchesData.map(m => m.id).filter(Boolean)

    const [allWallets, pools] = await Promise.all([
      walletIds.length > 0 
        ? db.select().from(wallets).where(inArray(wallets.id, walletIds))
        : Promise.resolve([]),
      matchIds.length > 0
        ? db.select().from(betPools).where(inArray(betPools.matchId, matchIds))
        : Promise.resolve([])
    ])

    const walletsMap = new Map(allWallets.map(w => [w.id, w]))
    const poolsMap = new Map(pools.map(p => [p.matchId, p]))

    const enrichedMatches = matchesData.map(match => ({
      ...match,
      walletA: walletsMap.get(match.walletAId),
      walletB: walletsMap.get(match.walletBId),
      betPool: poolsMap.get(match.id),
    }))

    const result = { matches: enrichedMatches }
    await cache.set(cacheKey, result, 10)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { walletAId, walletBId, timeframe, startAt, endAt } = body

    const matchId = nanoid()
    const [match] = await db.insert(matches).values({
      id: matchId,
      walletAId,
      walletBId,
      timeframe,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      status: 'UPCOMING',
    }).returning()

    await db.insert(betPools).values({
      id: nanoid(),
      matchId,
      poolA: 0,
      poolB: 0,
      totalPool: 0,
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}
