import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

let _db: ReturnType<typeof drizzle> | null = null

export const getDb = () => {
  if (_db) return _db

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const client = postgres(databaseUrl)
  _db = drizzle(client, { schema })
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  }
})

export const isDatabaseConnected = () => {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL)
}
