import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { verifyPassword, generateToken, setAuthCookie, decryptPrivateKey } from '@/lib/auth'
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

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const privateKey = decryptPrivateKey(user.encryptedPrivateKey)
    const token = generateToken(user.id, user.email)
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        privateKey
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
