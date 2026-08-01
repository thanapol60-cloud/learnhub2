import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getNextLevel, demoteLevel } from '@/lib/assessment'
import { CEFRLevel } from '@/lib/cefr'
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

    // Update user stats and get the updated record back
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: isCorrect
        ? { correctAnswers: { increment: 1 } }
        : { wrongAnswers: { increment: 1 } },
    })

    // Calculate if user should advance or demote
    const totalAnswers = updatedUser.correctAnswers + updatedUser.wrongAnswers
    const accuracy = updatedUser.correctAnswers / totalAnswers

    const currentLevel = user.currentLevel as CEFRLevel
    let newLevel = currentLevel
    let canAdvance = false

    if (accuracy >= 0.8 && totalAnswers >= 3) {
      const nextLevel = getNextLevel(currentLevel)
      if (nextLevel) {
        newLevel = nextLevel
        canAdvance = true
      }
    } else if (accuracy < 0.5 && totalAnswers >= 2) {
      newLevel = demoteLevel(currentLevel)
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
