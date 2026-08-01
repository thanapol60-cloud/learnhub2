import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessmentHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const totalAnswers = user.correctAnswers + user.wrongAnswers
    const accuracy = totalAnswers > 0
      ? Math.round((user.correctAnswers / totalAnswers) * 100)
      : 0

    const recentAssessment = user.assessmentHistory[0]
      ? {
          date: user.assessmentHistory[0].createdAt,
          accuracy: accuracy,
          level: user.currentLevel,
        }
      : undefined

    return NextResponse.json({
      currentLevel: user.currentLevel,
      totalAssessments: user.assessmentHistory.length > 0 ? 1 : 0,
      bestScore: accuracy,
      recentAssessment,
    })
  } catch (error) {
    console.error('Failed to get dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard' },
      { status: 500 }
    )
  }
}
