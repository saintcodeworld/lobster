import { NextResponse } from 'next/server'
import { getCurrentUser, decryptPrivateKey } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ user: null })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    const privateKey = decryptPrivateKey(user.encryptedPrivateKey)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        privateKey,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
