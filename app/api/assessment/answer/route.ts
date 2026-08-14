import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { isSubjectKey, SubjectKey } from '@/lib/subjects'
import {
  getProgress,
  nextLevelOf,
  previousLevelOf,
  recordAnswer,
  setLevel,
} from '@/lib/subject-progress'

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

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // วิชามาจากตัวข้อสอบเอง ไม่ใช่จากไคลเอนต์ จึงสลับวิชากลางคันไม่ได้
    const subject: SubjectKey = isSubjectKey(question.subject) ? question.subject : 'english'

    const progress = await getProgress(user.id, subject)
    if (!progress) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Graded server-side: a client-supplied verdict could simply claim success
    const isCorrect = userAnswer === question.correctAnswer
    const levelAtAnswer = progress.currentLevel

    await prisma.assessmentRecord.create({
      data: {
        userId: user.id,
        questionId,
        userAnswer,
        isCorrect,
        currentLevel: levelAtAnswer,
      },
    })

    await recordAnswer(user.id, subject, isCorrect)

    // Walk back over the whole attempt rather than filtering by level: stopping
    // at the first record from a different level confines the streak to the
    // current stay at this level. Filtering by level instead would let older
    // answers from an earlier visit count, so one correct answer after a
    // demotion would bounce the learner straight back up.
    // จำกัดเฉพาะข้อของวิชานี้ ไม่ให้การสอบวิชาอื่นมาตัดสตรีค
    const recent = await prisma.assessmentRecord.findMany({
      where: {
        userId: user.id,
        question: { subject },
        ...(progress.assessmentStartedAt
          ? { createdAt: { gte: progress.assessmentStartedAt } }
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
      const next = nextLevelOf(subject, levelAtAnswer)
      if (next) {
        newLevel = next
        levelChange = 'up'
      }
    } else if (!isCorrect && streak >= WRONG_STREAK_TO_DEMOTE) {
      const previous = previousLevelOf(subject, levelAtAnswer)
      if (previous !== levelAtAnswer) {
        newLevel = previous
        levelChange = 'down'
      }
    }

    if (newLevel !== levelAtAnswer) {
      await setLevel(user.id, subject, newLevel)
    }

    const correctAnswers = progress.correctAnswers + (isCorrect ? 1 : 0)
    const wrongAnswers = progress.wrongAnswers + (isCorrect ? 0 : 1)
    const totalAnswered = correctAnswers + wrongAnswers

    return NextResponse.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      subject,
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
