import { NextResponse } from 'next/server'
import { isDatabaseConnected } from '@/lib/db'

export async function GET() {
  const dbConnected = isDatabaseConnected()
  
  return NextResponse.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'not configured',
    timestamp: new Date().toISOString(),
    message: dbConnected 
      ? 'All systems operational' 
      : '⚠️ Database not configured. Set DATABASE_URL in .env.local',
  })
}
