import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { isSubjectKey } from '@/lib/subjects'
import { explainAnswer } from '@/lib/ai/explain-answer'

export const dynamic = 'force-dynamic'

/**
 * คำอธิบายเฉพาะบุคคลสำหรับข้อที่ตอบผิด
 *
 * เรียกหลังจากผู้เรียนตอบผิดแล้วเท่านั้น และตรวจกับฐานข้อมูลว่าเขาตอบข้อนี้จริง
 * ไม่งั้นจะกลายเป็นช่องให้เรียกโมเดลฟรีด้วยข้อความอะไรก็ได้ ซึ่งเป็นทั้งค่าใช้จ่าย
 * และช่องทางให้คนเอาไปใช้ผิดวัตถุประสงค์
 */
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { questionId } = await request.json()
    if (!questionId) {
      return NextResponse.json({ error: 'ต้องระบุ questionId' }, { status: 400 })
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'ไม่พบข้อสอบ' }, { status: 404 })
    }

    // ต้องเป็นข้อที่ผู้เรียนคนนี้ตอบไปจริง และตอบผิด
    const record = await prisma.assessmentRecord.findFirst({
      where: { userId: user.id, questionId, isCorrect: false },
      orderBy: { createdAt: 'desc' },
    })
    if (!record) {
      return NextResponse.json(
        { error: 'ไม่พบประวัติการตอบผิดของข้อนี้' },
        { status: 403 }
      )
    }

    const subject = isSubjectKey(question.subject) ? question.subject : 'english'

    const result = await explainAnswer({
      subject,
      level: question.cefrLevel,
      topic: question.topic,
      question: question.question,
      passage: question.passage,
      userAnswer: record.userAnswer,
      correctAnswer: question.correctAnswer,
      storedExplanation: question.explanation,
      userId: user.id,
    })

    if (result.status !== 'ok' || !result.data) {
      // ไม่ถือเป็นข้อผิดพลาดของผู้ใช้ — คำอธิบายมาตรฐานยังอยู่ในหน้าจอเสมอ
      return NextResponse.json({
        available: false,
        reason: result.status === 'no-key' ? 'no-key' : 'error',
        message: result.message,
      })
    }

    return NextResponse.json({ available: true, explanation: result.data })
  } catch (error) {
    console.error('อธิบายคำตอบไม่สำเร็จ:', error)
    return NextResponse.json({ error: 'อธิบายคำตอบไม่สำเร็จ' }, { status: 500 })
  }
}
