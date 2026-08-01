import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { initializeAssessment } from '@/lib/assessment'

export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.create({
      data: {
        email: `user_${Date.now()}@learnhub.local`,
        name: `User ${Date.now()}`,
        currentLevel: 'A1',
      },
    })

    // Store user ID in session/cookie
    const response = NextResponse.json({
      userId: user.id,
      message: 'Assessment started',
    })

    response.cookies.set('userId', user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Failed to start assessment:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}
