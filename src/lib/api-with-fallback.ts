import { api } from './api'

export const apiWithFallback = {
  ...api,
  
  matches: {
    ...api.matches,
    list: async (status?: string) => {
      try {
        return await api.matches.list(status)
      } catch (error) {
        console.warn('API call failed, returning empty data:', error)
        return { matches: [] }
      }
    },
    get: async (id: string) => {
      try {
        return await api.matches.get(id)
      } catch (error) {
        console.warn('API call failed:', error)
        return { match: null }
      }
    },
  },

  user: {
    getProfile: async (walletAddress: string) => {
      try {
        return await api.user.getProfile(walletAddress)
      } catch (error) {
        console.warn('User profile fetch failed:', error)
        return {
          user: { id: 'temp', walletAddress, bets: [] },
          stats: {
            totalBets: 0,
            wonBets: 0,
            lostBets: 0,
            winRate: 0,
            totalWagered: 0,
            totalWon: 0,
            netProfit: 0,
            roi: 0,
          }
        }
      }
    },
  },

  leaderboard: {
    get: async (sortBy?: string, chain?: string, limit?: number) => {
      try {
        return await api.leaderboard.get(sortBy, chain, limit)
      } catch (error) {
        console.warn('Leaderboard fetch failed:', error)
        return { leaderboard: [] }
      }
    },
  },
}
