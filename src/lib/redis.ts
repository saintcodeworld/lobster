import Redis from 'ioredis'

const getRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_URL
  const token = process.env.UPSTASH_REDIS_TOKEN

  if (!url || !token) {
    console.warn('⚠️  Redis not configured - caching disabled')
    return null
  }

  const parsedUrl = new URL(url)
  
  return {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port || '6379'),
    password: token,
    tls: url.startsWith('https') ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 1) return null
      return 100
    },
    connectTimeout: 5000,
    lazyConnect: true,
  }
}

const config = getRedisConfig()

export const redis = config 
  ? new Redis(config) 
  : {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      keys: async () => [],
      quit: async () => 'OK',
      on: () => {},
    } as any

if (config) {
  redis.on('error', (err: any) => {
    console.error('Redis Client Error', err)
  })

  redis.on('connect', () => {
    console.log('✓ Redis Client Connected')
  })

  redis.connect().catch((err: any) => {
    console.error('Failed to connect to Redis:', err)
  })
}
