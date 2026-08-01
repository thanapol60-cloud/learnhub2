import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Must run per-request: a build-time cached result would report stale status
export const dynamic = 'force-dynamic'

/**
 * Diagnostic endpoint: confirms the deployment can reach the database.
 * Reports failure reasons without exposing credentials.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      { ok: false, database: 'DATABASE_URL is not set in this environment' },
      { status: 500 }
    )
  }

  try {
    const users = await prisma.user.count()
    return NextResponse.json({ ok: true, database: 'connected', users })
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : 'unknown error'
    return NextResponse.json({ ok: false, database: reason }, { status: 500 })
  }
}
