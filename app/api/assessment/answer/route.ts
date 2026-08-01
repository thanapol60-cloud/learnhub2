import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateAssessmentState, getNextLevel } from '@/lib/assessment'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    const { questionId, userAnswer, isCorrect } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Record the answer
    await prisma.assessmentRecord.create({
      data: {
        userId,
        questionId,
        userAnswer,
        isCorrect,
        currentLevel: user.currentLevel,
      },
    })

    // Update user stats
    if (isCorrect) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          correctAnswers: user.correctAnswers + 1,
        },
      })
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          wrongAnswers: user.wrongAnswers + 1,
        },
      })
    }

    // Get updated user and determine if level should change
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    })!

    // Calculate if user should advance or demote
    const totalAnswers = updatedUser.correctAnswers + updatedUser.wrongAnswers
    const accuracy = updatedUser.correctAnswers / totalAnswers

    let newLevel = user.currentLevel
    let canAdvance = false

    if (accuracy >= 0.8 && totalAnswers >= 3) {
      const nextLevel = getNextLevel(user.currentLevel)
      if (nextLevel) {
        newLevel = nextLevel
        canAdvance = true
      }
    } else if (accuracy < 0.5 && totalAnswers >= 2) {
      if (user.currentLevel !== 'A1') {
        newLevel = user.currentLevel === 'A2' ? 'A1' :
                   user.currentLevel === 'B1' ? 'A2' :
                   user.currentLevel === 'B2' ? 'B1' :
                   user.currentLevel === 'C1' ? 'B2' : 'C1'
      }
    }

    if (newLevel !== user.currentLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentLevel: newLevel },
      })
    }

    return NextResponse.json({
      newLevel,
      canAdvance,
      accuracy: (accuracy * 100).toFixed(2),
    })
  } catch (error) {
    console.error('Failed to process answer:', error)
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    )
  }
}
