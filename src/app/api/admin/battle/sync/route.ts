import { NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { db } from '@/lib/db'
import { matches, wallets, matchStats } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { calculatePortfolioValue } from '@/lib/portfolio-value'

const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'
const connection = new Connection(RPC_URL, 'confirmed')

export const dynamic = 'force-dynamic'
export const revalidate = 0

function calculateSuccessRate(signatures: any[]): number {
  if (signatures.length === 0) return 0
  const successfulTxs = signatures.filter(sig => !sig.err).length
  return (successfulTxs / signatures.length) * 100
}

export async function POST() {
  try {
    const [activeMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'LIVE'))
      .orderBy(desc(matches.createdAt))
      .limit(1)

    if (!activeMatch) {
      return NextResponse.json({ error: 'No active match' }, { status: 404 })
    }

    const [walletA] = await db.select().from(wallets).where(eq(wallets.id, activeMatch.walletAId))
    const [walletB] = await db.select().from(wallets).where(eq(wallets.id, activeMatch.walletBId))

    if (!walletA || !walletB) {
      return NextResponse.json({ error: 'Wallets not found' }, { status: 404 })
    }

    console.log('Syncing battle stats...')
    
    const [portfolioA, portfolioB, signaturesA, signaturesB] = await Promise.all([
      calculatePortfolioValue(connection, walletA.address),
      calculatePortfolioValue(connection, walletB.address),
      connection.getSignaturesForAddress(new PublicKey(walletA.address), { limit: 100 }),
      connection.getSignaturesForAddress(new PublicKey(walletB.address), { limit: 100 })
    ])

    const initialPortfolioA = activeMatch.initialPortfolioValueA || portfolioA.totalValueUSD
    const initialPortfolioB = activeMatch.initialPortfolioValueB || portfolioB.totalValueUSD

    if (!activeMatch.initialPortfolioValueA || !activeMatch.initialPortfolioValueB) {
      await db.update(matches)
        .set({
          initialPortfolioValueA: portfolioA.totalValueUSD,
          initialPortfolioValueB: portfolioB.totalValueUSD
        })
        .where(eq(matches.id, activeMatch.id))
    }

    const pnlA = initialPortfolioA > 0 
      ? ((portfolioA.totalValueUSD - initialPortfolioA) / initialPortfolioA) * 100 
      : 0
    const pnlB = initialPortfolioB > 0 
      ? ((portfolioB.totalValueUSD - initialPortfolioB) / initialPortfolioB) * 100 
      : 0

    console.log(`PnL Calculation:
      Wallet A: $${initialPortfolioA.toFixed(2)} → $${portfolioA.totalValueUSD.toFixed(2)} = ${pnlA.toFixed(2)}%
      Wallet B: $${initialPortfolioB.toFixed(2)} → $${portfolioB.totalValueUSD.toFixed(2)} = ${pnlB.toFixed(2)}%`)
    
    const now = Date.now() / 1000
    const last24hA = signaturesA.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400)
    )
    const last24hB = signaturesB.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400)
    )

    const successRateA = calculateSuccessRate(signaturesA)
    const successRateB = calculateSuccessRate(signaturesB)

    const volumeA = last24hA.length * 1.5
    const volumeB = last24hB.length * 1.2

    const [existingStats] = await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.matchId, activeMatch.id))

    if (existingStats) {
      await db.update(matchStats)
        .set({
          currentBalanceA: portfolioA.solValue * 1e9,
          currentBalanceB: portfolioB.solValue * 1e9,
          currentPortfolioValueA: portfolioA.totalValueUSD,
          currentPortfolioValueB: portfolioB.totalValueUSD,
          pnlA,
          pnlB,
          tokenCountA: portfolioA.tokens.length,
          tokenCountB: portfolioB.tokens.length,
          totalTradesA: signaturesA.length,
          totalTradesB: signaturesB.length,
          trades24hA: last24hA.length,
          trades24hB: last24hB.length,
          winRateA: successRateA,
          winRateB: successRateB,
          volumeA,
          volumeB,
          updatedAt: new Date()
        })
        .where(eq(matchStats.id, existingStats.id))
    } else {
      await db.insert(matchStats).values({
        id: nanoid(),
        matchId: activeMatch.id,
        currentBalanceA: portfolioA.solValue * 1e9,
        currentBalanceB: portfolioB.solValue * 1e9,
        currentPortfolioValueA: portfolioA.totalValueUSD,
        currentPortfolioValueB: portfolioB.totalValueUSD,
        pnlA,
        pnlB,
        tokenCountA: portfolioA.tokens.length,
        tokenCountB: portfolioB.tokens.length,
        totalTradesA: signaturesA.length,
        totalTradesB: signaturesB.length,
        trades24hA: last24hA.length,
        trades24hB: last24hB.length,
        winRateA: successRateA,
        winRateB: successRateB,
        volumeA,
        volumeB,
        updatedAt: new Date()
      })
    }

    await db.update(wallets)
      .set({
        pnlPct: pnlA,
        winRate: successRateA,
        lastUpdatedAt: new Date()
      })
      .where(eq(wallets.id, walletA.id))

    await db.update(wallets)
      .set({
        pnlPct: pnlB,
        winRate: successRateB,
        lastUpdatedAt: new Date()
      })
      .where(eq(wallets.id, walletB.id))

    console.log('Battle stats synced successfully')

    return NextResponse.json({ 
      success: true,
      stats: {
        walletA: { 
          portfolioValueUSD: portfolioA.totalValueUSD,
          solValue: portfolioA.solValue,
          tokensValueUSD: portfolioA.tokensValueUSD,
          pnl: pnlA, 
          successRate: successRateA, 
          trades24h: last24hA.length 
        },
        walletB: { 
          portfolioValueUSD: portfolioB.totalValueUSD,
          solValue: portfolioB.solValue,
          tokensValueUSD: portfolioB.tokensValueUSD,
          pnl: pnlB, 
          successRate: successRateB, 
          trades24h: last24hB.length 
        }
      }
    })

  } catch (error) {
    console.error('Error syncing battle stats:', error)
    return NextResponse.json({ error: 'Failed to sync stats' }, { status: 500 })
  }
}
