import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'
import { SEED_QUESTIONS } from '@/lib/seed-data'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    // ?force=true replaces the bank; assessment records cascade away with it
    const force = request.nextUrl.searchParams.get('force') === 'true'
    const existingCount = await prisma.question.count()

    if (existingCount > 0 && !force) {
      return NextResponse.json({
        message: 'Questions already exist. Pass ?force=true to replace them.',
        count: existingCount,
      })
    }

    if (force) {
      await prisma.question.deleteMany()
    }

    await prisma.question.createMany({ data: SEED_QUESTIONS })

    const byLevel = await prisma.question.groupBy({
      by: ['cefrLevel'],
      _count: { _all: true },
    })

    return NextResponse.json({
      message: 'Questions seeded successfully',
      count: SEED_QUESTIONS.length,
      byLevel: Object.fromEntries(
        byLevel.map((row) => [row.cefrLevel, row._count._all])
      ),
    })
  } catch (error) {
    console.error('Failed to seed questions:', error)
    return NextResponse.json(
      { error: 'Failed to seed questions' },
      { status: 500 }
    )
  }
}
