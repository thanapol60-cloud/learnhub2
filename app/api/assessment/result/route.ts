import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CEFRLevel, CEFR_LEVELS } from '@/lib/cefr'
import { getUser } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await prisma.user.findUnique({ where: { id: user.id } })
    if (!record) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In an adaptive test the level reached is the result; raw accuracy hovers
    // near the pass mark by design because difficulty tracks the learner.
    const cefrLevel = record.currentLevel as CEFRLevel
    const totalAnswers = record.correctAnswers + record.wrongAnswers
    const accuracy =
      totalAnswers > 0
        ? Math.round((record.correctAnswers / totalAnswers) * 100)
        : 0

    // Courses at the learner's level, plus the level below as reinforcement
    const levelIndex = CEFR_LEVELS.indexOf(cefrLevel)
    const relevantLevels = [cefrLevel]
    if (levelIndex > 0) relevantLevels.push(CEFR_LEVELS[levelIndex - 1])

    const recommendations = await prisma.course.findMany({
      where: { minCefrLevel: { in: relevantLevels } },
      include: { videos: { select: { id: true, title: true, duration: true } } },
      orderBy: { minCefrLevel: 'desc' },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { assessmentCompleted: true },
    })

    return NextResponse.json({
      cefrLevel,
      totalQuestions: totalAnswers,
      correctAnswers: record.correctAnswers,
      accuracy,
      recommendations,
    })
  } catch (error) {
    console.error('Failed to get result:', error)
    return NextResponse.json(
      { error: 'Failed to get result' },
      { status: 500 }
    )
  }
}
