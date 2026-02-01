import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { matches, wallets, rounds } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { Connection, PublicKey } from '@solana/web3.js'
import { calculatePortfolioValue } from '@/lib/portfolio-value'

const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'
const connection = new Connection(RPC_URL, 'confirmed')

export async function GET() {
  try {
    const [latestMatch] = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!latestMatch) {
      return NextResponse.json({ match: null })
    }

    const [walletA] = await db.select().from(wallets).where(eq(wallets.id, latestMatch.walletAId))
    const [walletB] = await db.select().from(wallets).where(eq(wallets.id, latestMatch.walletBId))

    return NextResponse.json({
      match: latestMatch,
      walletA,
      walletB
    })
  } catch (error) {
    console.error('Error fetching battle config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAAddress, walletBAddress } = await request.json()

    if (!walletAAddress || !walletBAddress) {
      return NextResponse.json({ error: 'Wallet addresses are required' }, { status: 400 })
    }

    // Upsert wallets
    let walletAId = nanoid()
    const [existingWalletA] = await db.select().from(wallets).where(eq(wallets.address, walletAAddress))
    if (existingWalletA) {
      walletAId = existingWalletA.id
    } else {
      await db.insert(wallets).values({
        id: walletAId,
        address: walletAAddress,
        chain: 'solana',
        label: 'Molt',
        riskTier: 'HIGH',
        isFeatured: true
      })
    }

    let walletBId = nanoid()
    const [existingWalletB] = await db.select().from(wallets).where(eq(wallets.address, walletBAddress))
    if (existingWalletB) {
      walletBId = existingWalletB.id
    } else {
      await db.insert(wallets).values({
        id: walletBId,
        address: walletBAddress,
        chain: 'solana',
        label: 'Blue Molt',
        riskTier: 'MEDIUM',
        isFeatured: true
      })
    }

    const [portfolioA, portfolioB] = await Promise.all([
      calculatePortfolioValue(connection, walletAAddress),
      calculatePortfolioValue(connection, walletBAddress)
    ])

    const matchId = nanoid()
    await db.insert(matches).values({
      id: matchId,
      walletAId,
      walletBId,
      timeframe: 'DAILY',
      startAt: new Date(),
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'LIVE',
      initialBalanceA: portfolioA.solValue * 1e9,
      initialBalanceB: portfolioB.solValue * 1e9,
      initialPortfolioValueA: portfolioA.totalValueUSD,
      initialPortfolioValueB: portfolioB.totalValueUSD
    })

    const roundId = nanoid()
    await db.insert(rounds).values({
      id: roundId,
      matchId,
      roundNumber: 1,
      startAt: new Date(),
      status: 'ACTIVE',
    })

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/battle/sync`, {
      method: 'POST'
    }).catch(err => console.error('Failed to trigger initial sync:', err))

    return NextResponse.json({
      success: true,
      matchId,
      initialPortfolios: {
        walletA: {
          totalValueUSD: portfolioA.totalValueUSD,
          solValue: portfolioA.solValue,
          tokensValueUSD: portfolioA.tokensValueUSD,
          tokenCount: portfolioA.tokens.length
        },
        walletB: {
          totalValueUSD: portfolioB.totalValueUSD,
          solValue: portfolioB.solValue,
          tokensValueUSD: portfolioB.tokensValueUSD,
          tokenCount: portfolioB.tokens.length
        }
      }
    })
  } catch (error) {
    console.error('Error updating battle config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
