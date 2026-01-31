import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bets, users, matches, wallets } from '@/db/schema'
import { desc, inArray } from 'drizzle-orm'

export async function GET() {
  try {
    const allBets = await db.select().from(bets).orderBy(desc(bets.createdAt)).limit(100)

    const userIds = [...new Set(allBets.map(b => b.userId))].filter(Boolean)
    const matchIds = [...new Set(allBets.map(b => b.matchId))].filter(Boolean)

    const [usersData, matchesData] = await Promise.all([
      userIds.length > 0 ? db.select().from(users).where(inArray(users.id, userIds)) : [],
      matchIds.length > 0 ? db.select().from(matches).where(inArray(matches.id, matchIds)) : [],
    ])

    const usersMap = new Map(usersData.map(u => [u.id, u]))
    const matchesMap = new Map(matchesData.map(m => [m.id, m]))

    const enrichedBets = allBets.map(bet => ({
      ...bet,
      user: usersMap.get(bet.userId),
      match: matchesMap.get(bet.matchId),
    }))

    return NextResponse.json({ bets: enrichedBets })
  } catch (error) {
    console.error('Error fetching admin bets:', error)
    return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
  }
}
