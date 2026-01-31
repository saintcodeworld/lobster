import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { hashPassword, generateWallet, encryptPrivateKey, generateToken, setAuthCookie } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const wallet = generateWallet()
    const passwordHash = await hashPassword(password)
    const encryptedKey = encryptPrivateKey(wallet.privateKey)

    const userId = nanoid()
    
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      walletAddress: wallet.address,
      encryptedPrivateKey: encryptedKey,
      publicKey: wallet.publicKey,
      role: 'USER',
      kycStatus: 'NONE'
    })

    const token = generateToken(userId, email)
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        walletAddress: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
