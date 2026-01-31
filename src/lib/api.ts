const API_BASE = '/api'

export const api = {
  matches: {
    list: async (status?: string) => {
      const url = status ? `${API_BASE}/matches?status=${status}` : `${API_BASE}/matches`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch matches')
      return res.json()
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE}/matches/${id}`)
      if (!res.ok) throw new Error('Failed to fetch match')
      return res.json()
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create match')
      return res.json()
    },
  },

  bets: {
    list: async (userId?: string, matchId?: string) => {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (matchId) params.append('matchId', matchId)
      const url = `${API_BASE}/bets?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch bets')
      return res.json()
    },
    create: async (data: { userId: string; matchId: string; side: 'A' | 'B'; amount: number }) => {
      const res = await fetch(`${API_BASE}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to place bet')
      }
      return res.json()
    },
  },

  wallets: {
    list: async (featured?: boolean, chain?: string) => {
      const params = new URLSearchParams()
      if (featured) params.append('featured', 'true')
      if (chain) params.append('chain', chain)
      const url = `${API_BASE}/wallets?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch wallets')
      return res.json()
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create wallet')
      return res.json()
    },
  },

  user: {
    getProfile: async (walletAddress: string) => {
      const res = await fetch(`${API_BASE}/user/profile?walletAddress=${walletAddress}`)
      if (!res.ok) throw new Error('Failed to fetch user profile')
      return res.json()
    },
  },

  leaderboard: {
    get: async (sortBy?: string, chain?: string, limit?: number) => {
      const params = new URLSearchParams()
      if (sortBy) params.append('sortBy', sortBy)
      if (chain) params.append('chain', chain)
      if (limit) params.append('limit', limit.toString())
      const url = `${API_BASE}/leaderboard?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return res.json()
    },
  },
}
