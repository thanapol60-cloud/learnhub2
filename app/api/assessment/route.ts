import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Please log in before starting an assessment' },
        { status: 401 }
      )
    }

    // Reset counters so each assessment starts from a clean slate at A1
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentLevel: 'A1',
        correctAnswers: 0,
        wrongAnswers: 0,
        assessmentCompleted: false,
      },
    })

    return NextResponse.json({
      userId: user.id,
      message: 'Assessment started',
    })
  } catch (error) {
    console.error('Failed to start assessment:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}
