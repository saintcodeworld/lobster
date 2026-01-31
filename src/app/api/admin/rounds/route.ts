import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rounds, roundDeposits, matches, wallets, matchStats } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET() {
  try {
    const [latestMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'LIVE'))
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!latestMatch) {
      return NextResponse.json({ round: null, message: 'No active match' })
    }

    let [activeRound] = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.matchId, latestMatch.id),
        eq(rounds.status, 'ACTIVE')
      ))
      .orderBy(desc(rounds.createdAt))
      .limit(1)

    if (!activeRound) {
      const [lastRound] = await db
        .select()
        .from(rounds)
        .where(eq(rounds.matchId, latestMatch.id))
        .orderBy(desc(rounds.roundNumber))
        .limit(1)

      const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1

      const roundId = nanoid()
      await db.insert(rounds).values({
        id: roundId,
        matchId: latestMatch.id,
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

    const deposits = await db
      .select()
      .from(roundDeposits)
      .where(eq(roundDeposits.roundId, activeRound.id))

    return NextResponse.json({
      round: activeRound,
      deposits,
      match: latestMatch
    })
  } catch (error) {
    console.error('Error fetching round:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, matchId } = body

    if (action === 'end_round') {
      const [activeRound] = await db
        .select()
        .from(rounds)
        .where(and(
          eq(rounds.matchId, matchId),
          eq(rounds.status, 'ACTIVE')
        ))
        .limit(1)

      if (!activeRound) {
        return NextResponse.json({ error: 'No active round' }, { status: 404 })
      }

      const [stats] = await db
        .select()
        .from(matchStats)
        .where(eq(matchStats.matchId, matchId))
        .limit(1)

      if (!stats) {
        return NextResponse.json({ error: 'No match stats found' }, { status: 404 })
      }

      const winnerWalletId = stats.pnlA > stats.pnlB 
        ? (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0].walletAId
        : (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0].walletBId

      await db
        .update(rounds)
        .set({
          status: 'ENDED',
          endAt: new Date(),
          finalPnlA: stats.pnlA,
          finalPnlB: stats.pnlB,
          winnerWalletId,
        })
        .where(eq(rounds.id, activeRound.id))

      const nextRoundId = nanoid()
      await db.insert(rounds).values({
        id: nextRoundId,
        matchId,
        roundNumber: activeRound.roundNumber + 1,
        startAt: new Date(),
        status: 'ACTIVE',
      })

      return NextResponse.json({ 
        success: true,
        endedRound: activeRound,
        newRound: { id: nextRoundId, roundNumber: activeRound.roundNumber + 1 }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing round:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

