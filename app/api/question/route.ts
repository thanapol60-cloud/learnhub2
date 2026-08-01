import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CEFRLevel } from '@/lib/cefr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const level = request.nextUrl.searchParams.get('level') as CEFRLevel

    if (!userId || !level) {
      return NextResponse.json(
        { error: 'Invalid request' },
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

    // Get a random question from the specified level
    const question = await prisma.question.findFirst({
      where: {
        cefrLevel: level,
      },
      skip: Math.floor(Math.random() * 100),
    })

    if (!question) {
      // If no questions at this level, return a basic one
      return NextResponse.json({
        question: {
          id: 'default-1',
          question: 'What is the English word for "สวัสดี"?',
          options: [
            { text: 'Hello', isCorrect: true },
            { text: 'Goodbye', isCorrect: false },
            { text: 'Thank you', isCorrect: false },
            { text: 'Please', isCorrect: false },
          ],
          explanation: 'The word "Hello" is the common English greeting for "สวัสดี".',
          cefrLevel: level,
        },
        currentLevel: user.currentLevel,
        canAdvance: false,
        progress: 50,
        totalAnswered: 0,
      })
    }

    // Calculate if user can advance to next level
    const totalAnswers = user.correctAnswers + user.wrongAnswers
    const accuracy = totalAnswers > 0 ? user.correctAnswers / totalAnswers : 0
    const canAdvance = accuracy >= 0.8 && totalAnswers >= 3

    // Get progress based on current level
    const levelIndex = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(user.currentLevel)
    const progress = ((levelIndex + 1) / 6) * 100

    return NextResponse.json({
      question: {
        id: question.id,
        question: question.question,
        options: question.options,
        explanation: question.explanation,
        cefrLevel: question.cefrLevel,
      },
      currentLevel: user.currentLevel,
      canAdvance,
      progress: Math.round(progress),
      totalAnswered: totalAnswers,
    })
  } catch (error) {
    console.error('Failed to get question:', error)
    return NextResponse.json(
      { error: 'Failed to get question' },
      { status: 500 }
    )
  }
}
