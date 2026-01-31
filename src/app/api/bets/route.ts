import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bets, matches, betPools, wallets, rounds, roundDeposits } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { redis } from '@/lib/redis'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, matchId, side, amount, txSignature } = body

    if (!userId || !matchId || !side || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bet data' }, { status: 400 })
    }

    if (!txSignature) {
      return NextResponse.json({ error: 'Transaction signature required' }, { status: 400 })
    }

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId))

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'LIVE' && match.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Match is not accepting bets' }, { status: 400 })
    }

    const [betPool] = await db.select().from(betPools).where(eq(betPools.matchId, matchId))

    if (!betPool) {
      return NextResponse.json({ error: 'Bet pool not found' }, { status: 404 })
    }

    const totalPool = betPool.poolA + betPool.poolB + amount
    const userPool = side === 'A' ? betPool.poolA + amount : betPool.poolB + amount
    const oddsSnapshot = totalPool / userPool

    const [bet] = await db.insert(bets).values({
      id: nanoid(),
      userId,
      matchId,
      side,
      amount,
      oddsSnapshot,
      status: 'PENDING',
      txSignature,
    }).returning()

    const [updatedPool] = await db.update(betPools)
      .set({
        poolA: side === 'A' ? betPool.poolA + amount : betPool.poolA,
        poolB: side === 'B' ? betPool.poolB + amount : betPool.poolB,
        totalPool,
        updatedAt: new Date(),
      })
      .where(eq(betPools.id, betPool.id))
      .returning()

    let [activeRound] = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.matchId, matchId),
        eq(rounds.status, 'ACTIVE')
      ))
      .orderBy(desc(rounds.createdAt))
      .limit(1)

    if (!activeRound) {
      const [lastRound] = await db
        .select()
        .from(rounds)
        .where(eq(rounds.matchId, matchId))
        .orderBy(desc(rounds.roundNumber))
        .limit(1)

      const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1
      const roundId = nanoid()
      
      await db.insert(rounds).values({
        id: roundId,
        matchId,
        roundNumber: nextRoundNumber,
        startAt: new Date(),
        status: 'ACTIVE',
      })

      ;[activeRound] = await db
        .select()
        .from(rounds)
        .where(eq(rounds.id, roundId))
        .limit(1)
    }

    await db.insert(roundDeposits).values({
      id: nanoid(),
      roundId: activeRound.id,
      userId,
      side,
      amount,
      oddsSnapshot,
      txSignature,
    })

    await db.update(rounds)
      .set({
        poolA: side === 'A' ? (activeRound.poolA || 0) + amount : (activeRound.poolA || 0),
        poolB: side === 'B' ? (activeRound.poolB || 0) + amount : (activeRound.poolB || 0),
        totalPool: (activeRound.totalPool || 0) + amount,
      })
      .where(eq(rounds.id, activeRound.id))

    await Promise.all([
      redis.set(
        `pool:${matchId}`,
        JSON.stringify({
          poolA: updatedPool.poolA,
          poolB: updatedPool.poolB,
          totalPool: updatedPool.totalPool,
        }),
        'EX',
        60
      ),
      redis.del(`matches:LIVE`),
      redis.del(`matches:ALL`),
      redis.del(`user:profile:${body.userId}`),
    ])

    return NextResponse.json({ bet, pool: updatedPool }, { status: 201 })
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const matchId = searchParams.get('matchId')

    const query = db
      .select()
      .from(bets)
      .where(
        userId ? eq(bets.userId, userId) : 
        matchId ? eq(bets.matchId, matchId) : 
        undefined
      )
      .limit(100)

    const betsData = await query

    return NextResponse.json({ bets: betsData })
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
  }
}
