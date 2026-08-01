import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateCEFRLevel } from '@/lib/cefr'
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
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const totalAnswers = user.correctAnswers + user.wrongAnswers
    const cefrLevel = calculateCEFRLevel(user.correctAnswers, totalAnswers)
    const accuracy = totalAnswers > 0
      ? Math.round((user.correctAnswers / totalAnswers) * 100)
      : 0

    // Get recommended courses based on CEFR level
    const recommendations = await prisma.course.findMany({
      where: {
        minCefrLevel: cefrLevel,
      },
      take: 5,
    })

    return NextResponse.json({
      cefrLevel,
      totalQuestions: totalAnswers,
      correctAnswers: user.correctAnswers,
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
