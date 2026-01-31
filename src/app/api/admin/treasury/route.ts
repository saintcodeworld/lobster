import { NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export async function GET() {
  try {
    const treasuryPubkey = new PublicKey(
      process.env.NEXT_PUBLIC_TREASURY_WALLET || 'ArLNcJPEZF3r1ETCJA6hbFaGTSk8GgcFX4c9wjvsRiNa'
    )

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    const connection = new Connection(rpcUrl, 'confirmed')

    const balance = await connection.getBalance(treasuryPubkey)
    const balanceSOL = balance / LAMPORTS_PER_SOL

    return NextResponse.json({ 
      balance: balanceSOL,
      address: treasuryPubkey.toBase58(),
    })
  } catch (error) {
    console.error('Error fetching treasury balance:', error)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}
