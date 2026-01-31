import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allSettings = await db.select().from(settings)
    const settingsMap = allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    await db.insert(settings)
      .values({
        id: nanoid(),
        key,
        value,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ success: true, key, value })
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
