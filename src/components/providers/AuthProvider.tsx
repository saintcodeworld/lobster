'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Keypair, PublicKey } from '@solana/web3.js'

interface User {
  id: string
  email: string
  walletAddress: string
  publicKey: string
  privateKey: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getKeypair: () => Keypair | null
  getPublicKey: () => PublicKey | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Session check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    setUser(data.user)
  }

  const signup = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed')
    }

    setUser(data.user)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const getKeypair = (): Keypair | null => {
    if (!user?.privateKey) return null
    try {
      const secretKey = Buffer.from(user.privateKey, 'base64')
      return Keypair.fromSecretKey(secretKey)
    } catch (error) {
      console.error('Failed to create keypair:', error)
      return null
    }
  }

  const getPublicKey = (): PublicKey | null => {
    if (!user?.publicKey) return null
    try {
      return new PublicKey(user.publicKey)
    } catch (error) {
      console.error('Failed to create public key:', error)
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getKeypair, getPublicKey }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
