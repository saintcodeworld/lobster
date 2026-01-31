import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { db } from '../src/lib/db'
import { redis } from '../src/lib/redis'
import { users } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function verifySetup() {
  console.log('🔍 Verifying deployment setup...\n')

  console.log('✅ Environment variables:')
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`)
  console.log(`  UPSTASH_REDIS_URL: ${process.env.UPSTASH_REDIS_URL ? '✓' : '✗'}`)
  console.log(`  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✓' : '✗'}`)

  try {
    console.log('\n📊 Testing database connection...')
    const result = await db.execute(sql`SELECT 1`)
    console.log('  ✓ Database connected successfully')
    
    const userCount = await db.select().from(users)
    console.log(`  ✓ Found ${userCount.length} users in database`)
  } catch (error) {
    console.error('  ✗ Database connection failed:', error)
  }

  try {
    console.log('\n🔴 Testing Redis connection...')
    await redis.set('test', 'verified', 'EX', 10)
    const value = await redis.get('test')
    if (value === 'verified') {
      console.log('  ✓ Redis connected successfully')
    } else {
      console.log('  ✗ Redis write/read failed')
    }
  } catch (error) {
    console.error('  ✗ Redis connection failed:', error)
  }

  await redis.quit()

  console.log('\n✨ Setup verification complete!')
  process.exit(0)
}

verifySetup()
