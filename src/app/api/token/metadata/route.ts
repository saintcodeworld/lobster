import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const connection = new Connection(RPC_URL)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mint = searchParams.get('mint')

    if (!mint) {
      return NextResponse.json({ error: 'Mint address required' }, { status: 400 })
    }

    const mintPubkey = new PublicKey(mint)
    const accountInfo = await connection.getParsedAccountInfo(mintPubkey)

    if (!accountInfo.value) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    const data = accountInfo.value.data as any
    const tokenInfo = {
      mint,
      name: data.parsed?.info?.name || 'Unknown Token',
      symbol: data.parsed?.info?.symbol || '???',
      decimals: data.parsed?.info?.decimals || 9,
      supply: data.parsed?.info?.supply || 0
    }

    return NextResponse.json(tokenInfo)
  } catch (error) {
    console.error('Error fetching token metadata:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}
