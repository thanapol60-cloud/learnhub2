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

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        currentLevel: true,
        correctAnswers: true,
        wrongAnswers: true,
        assessmentStartedAt: true,
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const level = (request.nextUrl.searchParams.get('level') ||
      record.currentLevel) as CEFRLevel

    if (!CEFR_LEVELS.includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    // Questions already answered in this attempt, so they are not repeated
    const answered = await prisma.assessmentRecord.findMany({
      where: {
        userId: user.id,
        ...(record.assessmentStartedAt
          ? { createdAt: { gte: record.assessmentStartedAt } }
          : {}),
      },
      select: { questionId: true },
    })
    const answeredIds = answered.map((a) => a.questionId)

    const candidates = await prisma.question.findMany({
      where: {
        cefrLevel: level,
        id: { notIn: answeredIds.length > 0 ? answeredIds : undefined },
      },
      select: {
        id: true,
        passage: true,
        question: true,
        options: true,
        explanation: true,
        cefrLevel: true,
        category: true,
      },
    })

    if (candidates.length === 0) {
      const bankSize = await prisma.question.count()
      return NextResponse.json(
        {
          error:
            bankSize === 0
              ? 'No questions in the database. An admin needs to seed the question bank.'
              : `No unanswered questions left at level ${level}.`,
          exhausted: true,
          currentLevel: record.currentLevel,
        },
        { status: 404 }
      )
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)]

    // ตัวเลือกถูกเก็บตามลำดับที่ผู้เขียนข้อสอบใส่ไว้ ซึ่งเอียงไปทางข้อแรก
    // (เคยวัดได้ว่าเฉลยอยู่ข้อแรก 51% ของคลัง) ถ้าไม่สลับ ผู้เรียนเดาข้อแรก
    // ก็ได้คะแนนเกินการสุ่ม ระดับที่วัดได้จะสูงกว่าความจริง
    // การตรวจคำตอบเทียบด้วยข้อความ ไม่ใช่ตำแหน่ง จึงสลับตอนส่งได้อย่างปลอดภัย
    const options = Array.isArray(picked.options) ? [...(picked.options as unknown[])] : []
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    const question = { ...picked, options }

    const totalAnswered = record.correctAnswers + record.wrongAnswers
    const levelIndex = CEFR_LEVELS.indexOf(record.currentLevel as CEFRLevel)

    return NextResponse.json({
      question,
      currentLevel: record.currentLevel,
      progress: Math.round(((levelIndex + 1) / CEFR_LEVELS.length) * 100),
      totalAnswered,
      correctAnswers: record.correctAnswers,
      remainingAtLevel: candidates.length,
    })
  } catch (error) {
    console.error('Failed to get question:', error)
    return NextResponse.json(
      { error: 'Failed to get question' },
      { status: 500 }
    )
  }
}
