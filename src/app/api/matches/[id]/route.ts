import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { matches, wallets, betPools, bets, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [match] = await db.select().from(matches).where(eq(matches.id, id))

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const [walletA] = await db.select().from(wallets).where(eq(wallets.id, match.walletAId))
    const [walletB] = await db.select().from(wallets).where(eq(wallets.id, match.walletBId))
    const [betPool] = await db.select().from(betPools).where(eq(betPools.matchId, id))
    const matchBets = await db.select().from(bets).where(eq(bets.matchId, id)).limit(20)

    const betsWithUsers = await Promise.all(
      matchBets.map(async (bet) => {
        const [user] = await db.select().from(users).where(eq(users.id, bet.userId))
        return { ...bet, user }
      })
    )

    return NextResponse.json({
      match: {
        ...match,
        walletA,
        walletB,
        betPool,
        bets: betsWithUsers,
      },
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
