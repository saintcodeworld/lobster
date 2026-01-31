import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bets, matches, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 })
    }

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId))

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status === 'SETTLED') {
      return NextResponse.json({ error: 'Match already settled' }, { status: 400 })
    }

    if (!match.winnerWalletId) {
      return NextResponse.json({ error: 'No winner determined yet' }, { status: 400 })
    }

    const winningSide = match.winnerWalletId === match.walletAId ? 'A' : 'B'

    const matchBets = await db.select().from(bets).where(eq(bets.matchId, matchId))
    const winningBets = matchBets.filter(b => b.side === winningSide)
    const totalPool = matchBets.reduce((sum, b) => sum + b.amount, 0)
    const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0)

    if (winningPool === 0) {
      return NextResponse.json({ error: 'No winning bets' }, { status: 400 })
    }

    const houseFee = totalPool * 0.025
    const payoutPool = totalPool - houseFee

    const payouts = winningBets.map(bet => ({
      betId: bet.id,
      userId: bet.userId,
      payout: (bet.amount / winningPool) * payoutPool,
    }))

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    )

    const treasurySecret = process.env.TREASURY_SECRET
    if (!treasurySecret) {
      return NextResponse.json({ error: 'Treasury key not configured' }, { status: 500 })
    }

    const treasuryKeypair = Keypair.fromSecretKey(
      Buffer.from(treasurySecret, 'base64')
    )

    const userIds = payouts.map(p => p.userId)
    const usersData = await db.select().from(users).where(inArray(users.id, userIds))
    const usersMap = new Map(usersData.map(u => [u.id, u]))

    const signatures = []

    for (const payout of payouts) {
      const user = usersMap.get(payout.userId)
      if (!user) continue

      const recipientPubkey = new PublicKey(user.walletAddress)
      const lamports = Math.floor(payout.payout * LAMPORTS_PER_SOL)

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = treasuryKeypair.publicKey
      tx.sign(treasuryKeypair)

      const signature = await connection.sendRawTransaction(tx.serialize())
      await connection.confirmTransaction(signature, 'confirmed')
      
      signatures.push({ userId: payout.userId, signature, amount: payout.payout })

      await db.update(bets)
        .set({ status: 'SETTLED', payoutAmount: payout.payout })
        .where(eq(bets.id, payout.betId))
    }

    await db.update(matches)
      .set({ status: 'SETTLED' })
      .where(eq(matches.id, matchId))

    return NextResponse.json({ 
      success: true,
      payouts: signatures,
      totalPaid: signatures.reduce((sum, s) => sum + s.amount, 0),
    })
  } catch (error) {
    console.error('Error settling match:', error)
    return NextResponse.json({ error: 'Failed to settle match' }, { status: 500 })
  }
}
