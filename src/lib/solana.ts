import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export const getSolanaConnection = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  return new Connection(rpcUrl, 'confirmed')
}

export const TREASURY_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY_WALLET || 'HsFbJfZsupAxMA2jG9T1yVNU6yPDCnz5LD8NMvnDRJCg'
)

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export const createBetTransaction = async (
  fromPubkey: PublicKey,
  amount: number
): Promise<Transaction> => {
  const connection = getSolanaConnection()
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: TREASURY_WALLET,
      lamports,
    })
  )

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey

  return transaction
}

export const sendTransaction = async (
  connection: Connection,
  transaction: Transaction,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<string> => {
  const signed = await signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())
  await connection.confirmTransaction(signature, 'confirmed')
  return signature
}
