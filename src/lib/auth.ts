import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Keypair } from '@solana/web3.js'
import crypto from 'crypto'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-32-characters'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateWallet() {
  const keypair = Keypair.generate()
  const privateKey = Buffer.from(keypair.secretKey).toString('base64')
  const publicKey = keypair.publicKey.toBase58()
  
  return {
    keypair,
    privateKey,
    publicKey,
    address: publicKey
  }
}

export function encryptPrivateKey(privateKey: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

export function decryptPrivateKey(encryptedPrivateKey: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  const parts = encryptedPrivateKey.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value
}

export async function getCurrentUser(): Promise<{ userId: string; email: string } | null> {
  const token = await getAuthToken()
  if (!token) return null
  return verifyToken(token)
}
