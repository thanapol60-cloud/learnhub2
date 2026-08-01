import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getNextLevel, demoteLevel } from '@/lib/assessment'
import { CEFRLevel } from '@/lib/cefr'
import { getUser } from '@/lib/auth-middleware'

const CORRECT_STREAK_TO_ADVANCE = 3
const WRONG_STREAK_TO_DEMOTE = 2

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId, userAnswer } = await request.json()
    if (!questionId || typeof userAnswer !== 'string') {
      return NextResponse.json(
        { error: 'questionId and userAnswer are required' },
        { status: 400 }
      )
    }

    const [record, question] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.question.findUnique({ where: { id: questionId } }),
    ])

    if (!record) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Graded server-side: a client-supplied verdict could simply claim success
    const isCorrect = userAnswer === question.correctAnswer
    const levelAtAnswer = record.currentLevel as CEFRLevel

    await prisma.assessmentRecord.create({
      data: {
        userId: user.id,
        questionId,
        userAnswer,
        isCorrect,
        currentLevel: levelAtAnswer,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: isCorrect
        ? { correctAnswers: { increment: 1 } }
        : { wrongAnswers: { increment: 1 } },
    })

    // Walk back over the whole attempt rather than filtering by level: stopping
    // at the first record from a different level confines the streak to the
    // current stay at this level. Filtering by level instead would let older
    // answers from an earlier visit count, so one correct answer after a
    // demotion would bounce the learner straight back up.
    const recent = await prisma.assessmentRecord.findMany({
      where: {
        userId: user.id,
        ...(record.assessmentStartedAt
          ? { createdAt: { gte: record.assessmentStartedAt } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: CORRECT_STREAK_TO_ADVANCE,
      select: { isCorrect: true, currentLevel: true },
    })

    let streak = 0
    for (const entry of recent) {
      if (entry.currentLevel !== levelAtAnswer) break
      if (entry.isCorrect !== isCorrect) break
      streak += 1
    }

    let newLevel = levelAtAnswer
    let levelChange: 'up' | 'down' | null = null

    if (isCorrect && streak >= CORRECT_STREAK_TO_ADVANCE) {
      const next = getNextLevel(levelAtAnswer)
      if (next) {
        newLevel = next
        levelChange = 'up'
      }
    } else if (!isCorrect && streak >= WRONG_STREAK_TO_DEMOTE) {
      const previous = demoteLevel(levelAtAnswer)
      if (previous !== levelAtAnswer) {
        newLevel = previous
        levelChange = 'down'
      }
    }

    if (newLevel !== levelAtAnswer) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentLevel: newLevel },
      })
    }

    const correctAnswers = record.correctAnswers + (isCorrect ? 1 : 0)
    const wrongAnswers = record.wrongAnswers + (isCorrect ? 0 : 1)
    const totalAnswered = correctAnswers + wrongAnswers

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      newLevel,
      levelChange,
      streak,
      totalAnswered,
      correctAnswers,
      accuracy: totalAnswered > 0
        ? Math.round((correctAnswers / totalAnswered) * 100)
        : 0,
    })
  } catch (error) {
    console.error('Failed to process answer:', error)
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    )
  }
}
