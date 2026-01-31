import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

const HELIUS_API_KEY = '0ea40bdc-d3f4-4541-b6bd-9b6ee85007a1'

const WELL_KNOWN_TOKENS: Record<string, number> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.0,
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.0,
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 1.0,
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr': 1.0,
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 1.0,
}

export async function getTokenPrices(mintAddresses: string[]): Promise<Map<string, number>> {
  if (mintAddresses.length === 0) return new Map()
  
  const priceMap = new Map<string, number>()
  
  for (const mint of mintAddresses) {
    if (WELL_KNOWN_TOKENS[mint] !== undefined) {
      priceMap.set(mint, WELL_KNOWN_TOKENS[mint])
      continue
    }
  }
  
  const unknownMints = mintAddresses.filter(m => !WELL_KNOWN_TOKENS[m])
  if (unknownMints.length === 0) return priceMap
  
  try {
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'token-prices',
          method: 'getAssetBatch',
          params: {
            ids: unknownMints.slice(0, 100)
          }
        })
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.result) {
        for (const asset of data.result) {
          if (asset?.token_info?.price_info?.price_per_token) {
            priceMap.set(asset.id, asset.token_info.price_info.price_per_token)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching token prices from Helius:', error)
  }
  
  return priceMap
}

export async function calculatePortfolioValue(
  connection: Connection,
  walletAddress: string
): Promise<{ totalValueUSD: number; solValue: number; tokensValueUSD: number; tokens: any[] }> {
  const pubkey = new PublicKey(walletAddress)
  
  const [solBalance, tokenAccounts] = await Promise.all([
    connection.getBalance(pubkey),
    connection.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID })
  ])

  const tokens = tokenAccounts.value
    .map((acc: any) => ({
      mint: acc.account.data.parsed.info.mint,
      balance: acc.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: acc.account.data.parsed.info.tokenAmount.decimals
    }))
    .filter((t: any) => t.balance > 0)
    .sort((a: any, b: any) => b.balance - a.balance)

  console.log(`Wallet ${walletAddress} has ${tokens.length} tokens`)
  tokens.slice(0, 10).forEach(t => {
    console.log(`  Token: ${t.mint} Balance: ${t.balance}`)
  })

  const solValueUSD = await getSolPriceUSD()
  const solValue = solBalance / 1e9
  const solValueInUSD = solValue * solValueUSD

  const mintAddresses = tokens.map(t => t.mint)
  const tokenPrices = await getTokenPrices(mintAddresses)

  let tokensValueUSD = 0
  const tokensWithValue = tokens.map(token => {
    const price = tokenPrices.get(token.mint) || 0
    const valueUSD = token.balance * price
    tokensValueUSD += valueUSD
    
    if (valueUSD > 10) {
      console.log(`  ${token.mint}: ${token.balance} @ $${price} = $${valueUSD.toFixed(2)}`)
    }
    
    return {
      ...token,
      priceUSD: price,
      valueUSD
    }
  })

  console.log(`Portfolio total: SOL ${solValueInUSD.toFixed(2)} + Tokens ${tokensValueUSD.toFixed(2)} = $${(solValueInUSD + tokensValueUSD).toFixed(2)}`)

  return {
    totalValueUSD: solValueInUSD + tokensValueUSD,
    solValue,
    tokensValueUSD,
    tokens: tokensWithValue
  }
}

async function getSolPriceUSD(): Promise<number> {
  try {
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'sol-price',
          method: 'getAsset',
          params: {
            id: 'So11111111111111111111111111111111111111112'
          }
        })
      }
    )
    
    if (!response.ok) {
      console.error(`Helius API error: ${response.status}`)
      return 123.45
    }
    
    const data = await response.json()
    return data?.result?.token_info?.price_info?.price_per_token || 123.45
  } catch (error) {
    console.error('Error fetching SOL price:', error)
    return 123.45
  }
}
