import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'
import { isSubjectKey, levelsOf } from '@/lib/subjects'
import { getProgress } from '@/lib/subject-progress'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subjectParam = request.nextUrl.searchParams.get('subject') ?? 'english'
    if (!isSubjectKey(subjectParam)) {
      return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
    }
    const subject = subjectParam
    const levels = levelsOf(subject)

    const progress = await getProgress(user.id, subject)
    if (!progress) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const level = request.nextUrl.searchParams.get('level') || progress.currentLevel
    if (!levels.includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    // Questions already answered in this attempt, so they are not repeated
    const answered = await prisma.assessmentRecord.findMany({
      where: {
        userId: user.id,
        ...(progress.assessmentStartedAt
          ? { createdAt: { gte: progress.assessmentStartedAt } }
          : {}),
      },
      select: { questionId: true },
    })
    const answeredIds = answered.map((a) => a.questionId)

    const pickFrom = (candidateLevel: string) =>
      prisma.question.findMany({
        where: {
          subject,
          cefrLevel: candidateLevel,
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
          topic: true,
        },
      })

    let candidates = await pickFrom(level)
    let servedLevel = level

    // ถ้าข้อในระดับนี้ถูกใช้หมดแล้ว ให้ขยับไปหาระดับข้างเคียงแทนที่จะจบการสอบกลางคัน
    // เรียงจากใกล้ไปไกล เพื่อให้ความยากยังใกล้เคียงระดับที่ผู้เรียนอยู่
    if (candidates.length === 0) {
      const index = levels.indexOf(level)
      const neighbours = levels
        .map((lv, i) => ({ lv, distance: Math.abs(i - index) }))
        .filter((entry) => entry.distance > 0)
        .sort((a, b) => a.distance - b.distance)

      for (const neighbour of neighbours) {
        const found = await pickFrom(neighbour.lv)
        if (found.length > 0) {
          candidates = found
          servedLevel = neighbour.lv
          break
        }
      }
    }

    if (candidates.length === 0) {
      const bankSize = await prisma.question.count({ where: { subject } })
      return NextResponse.json(
        {
          error:
            bankSize === 0
              ? 'ยังไม่มีข้อสอบของวิชานี้ในระบบ ผู้ดูแลต้องเพิ่มคลังข้อสอบก่อน'
              : `ข้อสอบวิชานี้ถูกใช้ครบทุกข้อแล้วในการสอบรอบนี้`,
          exhausted: true,
          currentLevel: progress.currentLevel,
          subject,
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

    const totalAnswered = progress.correctAnswers + progress.wrongAnswers
    const levelIndex = levels.indexOf(progress.currentLevel)

    return NextResponse.json({
      question,
      subject,
      currentLevel: progress.currentLevel,
      servedLevel,
      progress: Math.round(((levelIndex + 1) / levels.length) * 100),
      totalAnswered,
      correctAnswers: progress.correctAnswers,
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
