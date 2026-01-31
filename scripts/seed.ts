import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { db } from '../src/lib/db'
import { wallets, matches, betPools } from '../src/db/schema'
import { nanoid } from 'nanoid'

async function seed() {
  console.log('🌱 Seeding database...\n')

  const walletsData = [
    {
      id: nanoid(),
      chain: 'solana',
      address: '7rTRXaN77zxykDAAUoF71qefte1ThcbZQtxp2jfdM18K',
      label: 'Claude',
      isFeatured: true,
      riskTier: 'HIGH',
      pnlPct: 127.5,
      pnlUsd: 342800,
      maxDrawdown: -15.3,
      volatility: 45.2,
      winRate: 68.4,
      sharpeApprox: 2.84,
      lastUpdatedAt: new Date(),
    },
    {
      id: nanoid(),
      chain: 'solana',
      address: 'HzFEr4RmK9pTsN3xQwZb2vKjLmPdC8yU6tHg4RmKXyZ',
      label: 'Solana Whale',
      isFeatured: true,
      riskTier: 'HIGH',
      pnlPct: 234.8,
      pnlUsd: 892100,
      maxDrawdown: -22.7,
      volatility: 38.9,
      winRate: 72.1,
      sharpeApprox: 3.12,
      lastUpdatedAt: new Date(),
    },
    {
      id: nanoid(),
      chain: 'solana',
      address: '9y4HMexX1w6s7CsHx34wbyZRibGRdspWxUPXAPKkrRwN',
      label: 'Grok',
      isFeatured: true,
      riskTier: 'MEDIUM',
      pnlPct: 89.2,
      pnlUsd: 178400,
      maxDrawdown: -8.7,
      volatility: 32.1,
      winRate: 61.5,
      sharpeApprox: 2.45,
      lastUpdatedAt: new Date(),
    },
    {
      id: nanoid(),
      chain: 'solana',
      address: 'AxNs9QwpLmPdC8yU6tHg4RmKXyZb2vKjQJwX',
      label: 'Moonshot Hunter',
      isFeatured: false,
      riskTier: 'EXTREME',
      pnlPct: 198.3,
      pnlUsd: 412500,
      maxDrawdown: -31.2,
      volatility: 52.7,
      winRate: 58.2,
      sharpeApprox: 1.98,
      lastUpdatedAt: new Date(),
    },
    {
      id: nanoid(),
      chain: 'solana',
      address: 'C5pdmNx2TqYb4jG3dRu7W2zjFzpDKqU9z3jQJwX',
      label: 'NFT Degen',
      isFeatured: false,
      riskTier: 'HIGH',
      pnlPct: 56.7,
      pnlUsd: 89700,
      maxDrawdown: -18.4,
      volatility: 41.8,
      winRate: 55.3,
      sharpeApprox: 2.12,
      lastUpdatedAt: new Date(),
    },
    {
      id: nanoid(),
      chain: 'solana',
      address: 'FkPo8Tr3LmPdC8yU6tHg4RmKXyZb2vKjQJwX',
      label: 'Meme Lord',
      isFeatured: false,
      riskTier: 'MEDIUM',
      pnlPct: 43.1,
      pnlUsd: 67300,
      maxDrawdown: -12.9,
      volatility: 38.4,
      winRate: 52.8,
      sharpeApprox: 1.87,
      lastUpdatedAt: new Date(),
    },
  ]

  console.log('📊 Creating wallets...')
  const insertedWallets = await db.insert(wallets).values(walletsData).returning()
  console.log(`  ✓ Created ${insertedWallets.length} wallets`)

  console.log('\n🏆 Creating matches...')

  const now = new Date()
  const matchesData = [
    {
      id: nanoid(),
      walletAId: insertedWallets[0].id,
      walletBId: insertedWallets[2].id,
      timeframe: 'DAILY' as const,
      startAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      status: 'LIVE' as const,
    },
    {
      id: nanoid(),
      walletAId: insertedWallets[1].id,
      walletBId: insertedWallets[3].id,
      timeframe: 'WEEKLY' as const,
      startAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'LIVE' as const,
    },
    {
      id: nanoid(),
      walletAId: insertedWallets[4].id,
      walletBId: insertedWallets[5].id,
      timeframe: 'DAILY' as const,
      startAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 9 * 60 * 60 * 1000),
      status: 'LIVE' as const,
    },
  ]

  const insertedMatches = await db.insert(matches).values(matchesData).returning()
  console.log(`  ✓ Created ${insertedMatches.length} matches`)

  console.log('\n💰 Creating bet pools...')
  const poolsData = insertedMatches.map(match => ({
    id: nanoid(),
    matchId: match.id,
    poolA: Math.random() * 50000 + 10000,
    poolB: Math.random() * 40000 + 10000,
    totalPool: 0,
  }))

  poolsData.forEach(pool => {
    pool.totalPool = pool.poolA + pool.poolB
  })

  const insertedPools = await db.insert(betPools).values(poolsData).returning()
  console.log(`  ✓ Created ${insertedPools.length} bet pools`)

  console.log('\n✨ Seed data created successfully!')
  console.log('\n🚀 You can now run: pnpm dev')

  process.exit(0)
}

seed().catch(console.error)
