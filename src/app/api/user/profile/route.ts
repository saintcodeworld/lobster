import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, bets, matches, wallets } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    let [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress))

    if (!user) {
      [user] = await db.insert(users).values({
        id: nanoid(),
        walletAddress,
        role: 'USER',
        email: `${walletAddress}@placeholder.com`, // Placeholder email
        passwordHash: 'placeholder', // Placeholder password hash
        encryptedPrivateKey: 'placeholder', // Placeholder private key
        publicKey: walletAddress, // Using wallet address as public key for now
      }).returning()
    }

    const userBets = await db.select().from(bets).where(eq(bets.userId, user.id)).orderBy(desc(bets.createdAt)).limit(50)
    
    const betPromises = userBets.map(async (bet) => {
      const [match] = await db.select().from(matches).where(eq(matches.id, bet.matchId))
      if (!match) return { ...bet, match: null }
      
      const [walletA] = await db.select().from(wallets).where(eq(wallets.id, match.walletAId))
      const [walletB] = await db.select().from(wallets).where(eq(wallets.id, match.walletBId))
      
      return {
        ...bet,
        match: {
          ...match,
          walletA,
          walletB
        }
      }
    })

    const betsWithMatches = await Promise.all(betPromises)

    const totalBets = userBets.length
    const wonBets = userBets.filter(b => b.status === 'SETTLED' && b.payoutAmount && b.payoutAmount > 0).length
    const lostBets = userBets.filter(b => b.status === 'SETTLED' && (!b.payoutAmount || b.payoutAmount === 0)).length
    const totalWagered = userBets.reduce((sum, b) => sum + b.amount, 0)
    const totalWon = userBets.reduce((sum, b) => sum + (b.payoutAmount || 0), 0)
    const netProfit = totalWon - totalWagered

    const stats = {
      totalBets,
      wonBets,
      lostBets,
      winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      totalWagered,
      totalWon,
      netProfit,
      roi: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
    }

    return NextResponse.json({ user: { ...user, bets: betsWithMatches }, stats })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}
