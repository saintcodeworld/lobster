import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { calculatePortfolioValue } from '@/lib/portfolio-value'

const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'
const connection = new Connection(RPC_URL, 'confirmed')

function calculateSuccessRate(signatures: any[]): number {
  if (signatures.length === 0) return 0
  const successfulTxs = signatures.filter(sig => !sig.err).length
  return (successfulTxs / signatures.length) * 100
}

export async function POST(request: NextRequest) {
  try {
    const { walletAAddress, walletBAddress } = await request.json()

    if (!walletAAddress || !walletBAddress) {
      return NextResponse.json({ error: 'Wallet addresses are required' }, { status: 400 })
    }

    const pubkeyA = new PublicKey(walletAAddress)
    const pubkeyB = new PublicKey(walletBAddress)
    
    const now = Date.now() / 1000
    
    const [portfolioA, portfolioB, allSigsA, allSigsB] = await Promise.all([
      calculatePortfolioValue(connection, walletAAddress),
      calculatePortfolioValue(connection, walletBAddress),
      connection.getSignaturesForAddress(pubkeyA, { limit: 100 }),
      connection.getSignaturesForAddress(pubkeyB, { limit: 100 })
    ])
    
    const last24hA = allSigsA.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400)
    )
    const last24hB = allSigsB.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400)
    )

    const last7dA = allSigsA.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400 * 7)
    )
    const last7dB = allSigsB.filter(sig => 
      sig.blockTime && sig.blockTime > (now - 86400 * 7)
    )

    const successRateA = calculateSuccessRate(allSigsA)
    const successRateB = calculateSuccessRate(allSigsB)

    return NextResponse.json({ 
      success: true,
      walletA: {
        address: walletAAddress,
        solBalance: portfolioA.solValue,
        portfolioValueUSD: portfolioA.totalValueUSD,
        tokensValueUSD: portfolioA.tokensValueUSD,
        tokenCount: portfolioA.tokens.length,
        recentTxs: allSigsA.length,
        trades24h: last24hA.length,
        trades7d: last7dA.length,
        txSuccessRate: successRateA,
        isValid: portfolioA.totalValueUSD > 0,
        isActive: last24hA.length > 0
      },
      walletB: {
        address: walletBAddress,
        solBalance: portfolioB.solValue,
        portfolioValueUSD: portfolioB.totalValueUSD,
        tokensValueUSD: portfolioB.tokensValueUSD,
        tokenCount: portfolioB.tokens.length,
        recentTxs: allSigsB.length,
        trades24h: last24hB.length,
        trades7d: last7dB.length,
        txSuccessRate: successRateB,
        isValid: portfolioB.totalValueUSD > 0,
        isActive: last24hB.length > 0
      }
    })
  } catch (error) {
    console.error('Error previewing battle:', error)
    return NextResponse.json({ error: 'Failed to preview battle data' }, { status: 500 })
  }
}
