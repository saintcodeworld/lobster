import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wallets } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isFeatured = searchParams.get('featured') === 'true'
    const chain = searchParams.get('chain')

    let query = db.select().from(wallets).$dynamic()

    if (isFeatured) {
      query = query.where(eq(wallets.isFeatured, true))
    }
    if (chain) {
      query = query.where(eq(wallets.chain, chain))
    }

    const walletsData = await query.orderBy(desc(wallets.pnlPct)).limit(100)

    return NextResponse.json({ wallets: walletsData })
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { chain, address, label, isFeatured, riskTier } = body

    const existing = await db.select().from(wallets)
      .where(and(eq(wallets.chain, chain), eq(wallets.address, address)))

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Wallet already exists' }, { status: 400 })
    }

    const [wallet] = await db.insert(wallets).values({
      id: nanoid(),
      chain,
      address,
      label,
      isFeatured: isFeatured || false,
      riskTier: riskTier || 'MEDIUM',
    }).returning()

    return NextResponse.json({ wallet }, { status: 201 })
  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }
}
