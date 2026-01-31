import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betPools, matches } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [activeMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'LIVE'))
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!activeMatch) {
      return NextResponse.json({ poolA: 0, poolB: 0, totalPool: 0 })
    }

    const [pool] = await db
      .select()
      .from(betPools)
      .where(eq(betPools.matchId, activeMatch.id))

    if (!pool) {
      return NextResponse.json({ poolA: 0, poolB: 0, totalPool: 0 })
    }

    return NextResponse.json({
      poolA: pool.poolA,
      poolB: pool.poolB,
      totalPool: pool.totalPool
    })
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { poolA, poolB } = await request.json()

    if (poolA === undefined || poolB === undefined) {
      return NextResponse.json({ error: 'Pool values required' }, { status: 400 })
    }

    const [activeMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'LIVE'))
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!activeMatch) {
      return NextResponse.json({ error: 'No active match' }, { status: 404 })
    }

    const [existingPool] = await db
      .select()
      .from(betPools)
      .where(eq(betPools.matchId, activeMatch.id))

    const totalPool = poolA + poolB

    if (existingPool) {
      await db.update(betPools)
        .set({
          poolA,
          poolB,
          totalPool,
          updatedAt: new Date()
        })
        .where(eq(betPools.id, existingPool.id))
    } else {
      await db.insert(betPools).values({
        id: nanoid(),
        matchId: activeMatch.id,
        poolA,
        poolB,
        totalPool,
        houseFeeBps: 250
      })
    }

    return NextResponse.json({ success: true, poolA, poolB, totalPool })
  } catch (error) {
    console.error('Error updating pools:', error)
    return NextResponse.json({ error: 'Failed to update pools' }, { status: 500 })
  }
}
