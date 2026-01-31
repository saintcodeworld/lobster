import { NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { db } from '@/lib/db'
import { matches, wallets, matchStats, rounds } from '@/db/schema'
import { desc, eq, and } from 'drizzle-orm'
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

export async function GET() {
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

    const now = Date.now() / 1000
    const last24hA = signaturesA.filter(sig =>
      sig.blockTime && sig.blockTime > (now - 86400)
    )
    const last24hB = signaturesB.filter(sig =>
      sig.blockTime && sig.blockTime > (now - 86400)
    )

    const successRateA = calculateSuccessRate(signaturesA)
    const successRateB = calculateSuccessRate(signaturesB)

    const [existingStats] = await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.matchId, activeMatch.id))

    // Daily Stats Logic
    const currentDate = new Date()
    let lastReset = existingStats?.lastDailyResetAt || new Date(0)

    // Check if it's a new day (UTC)
    const isNewDay = currentDate.getUTCDate() !== lastReset.getUTCDate() ||
      currentDate.getUTCMonth() !== lastReset.getUTCMonth() ||
      currentDate.getUTCFullYear() !== lastReset.getUTCFullYear()

    let dailyInitialA = existingStats?.dailyInitialPortfolioValueA ?? portfolioA.totalValueUSD
    let dailyInitialB = existingStats?.dailyInitialPortfolioValueB ?? portfolioB.totalValueUSD

    if (isNewDay) {
      // Calculate previous day final PnL for closing the round
      const finalDailyPnlA = dailyInitialA > 0
        ? ((portfolioA.totalValueUSD - dailyInitialA) / dailyInitialA) * 100
        : 0
      const finalDailyPnlB = dailyInitialB > 0
        ? ((portfolioB.totalValueUSD - dailyInitialB) / dailyInitialB) * 100
        : 0

      // Close active round
      const [activeRound] = await db
        .select()
        .from(rounds)
        .where(and(eq(rounds.matchId, activeMatch.id), eq(rounds.status, 'ACTIVE')))

      if (activeRound) {
        await db.update(rounds).set({
          status: 'ENDED',
          endAt: currentDate,
          finalPnlA: finalDailyPnlA,
          finalPnlB: finalDailyPnlB
        }).where(eq(rounds.id, activeRound.id))
      }

      // Reset for new day
      dailyInitialA = portfolioA.totalValueUSD
      dailyInitialB = portfolioB.totalValueUSD
      lastReset = currentDate
    }

    const dailyPnlA = dailyInitialA > 0
      ? ((portfolioA.totalValueUSD - dailyInitialA) / dailyInitialA) * 100
      : 0
    const dailyPnlB = dailyInitialB > 0
      ? ((portfolioB.totalValueUSD - dailyInitialB) / dailyInitialB) * 100
      : 0

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
          volumeA: last24hA.length * 1.5,
          volumeB: last24hB.length * 1.2,
          updatedAt: new Date(),
          dailyPnlA,
          dailyPnlB,
          dailyInitialPortfolioValueA: dailyInitialA,
          dailyInitialPortfolioValueB: dailyInitialB,
          lastDailyResetAt: lastReset
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
        volumeA: last24hA.length * 1.5,
        volumeB: last24hB.length * 1.2,
        updatedAt: new Date(),
        dailyPnlA,
        dailyPnlB,
        dailyInitialPortfolioValueA: dailyInitialA,
        dailyInitialPortfolioValueB: dailyInitialB,
        lastDailyResetAt: lastReset
      })
    }

    return NextResponse.json({
      success: true,
      pnlA: pnlA.toFixed(2),
      pnlB: pnlB.toFixed(2)
    })

  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
