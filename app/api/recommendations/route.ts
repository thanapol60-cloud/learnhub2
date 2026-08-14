import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/** ต้องพลาดอย่างน้อยเท่านี้ถึงจะนับว่าเป็นจุดอ่อน กันไม่ให้พลาดครั้งเดียวแล้วโดนยัดคอร์ส */
const MIN_WRONG = 1
const WEAK_ACCURACY = 0.6

/**
 * แนะนำคอร์สจาก "จุดที่ตอบผิดจริง" ไม่ใช่จากระดับรวมอย่างเดียว
 *
 * รวมผลตอบของผู้เรียนตามหัวข้อ (Question.topic) หาหัวข้อที่พลาดบ่อย
 * แล้วจับคู่กับคอร์สที่สอนหัวข้อนั้น (Course.topics)
 *
 * ตัวเลขที่คืนไปตรงไปตรงมาพอที่จะส่งต่อให้โมเดลภาษาช่วยเรียงลำดับหรือเขียนคำอธิบาย
 * ในภายหลังได้ โดยไม่ต้องแก้โครงสร้างข้อมูล
 */
export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { currentLevel: true, assessmentStartedAt: true },
    })

    const answers = await prisma.assessmentRecord.findMany({
      where: {
        userId: user.id,
        ...(record?.assessmentStartedAt
          ? { createdAt: { gte: record.assessmentStartedAt } }
          : {}),
      },
      select: {
        isCorrect: true,
        question: { select: { topic: true, cefrLevel: true } },
      },
    })

    // สรุปผลรายหัวข้อ
    const byTopic = new Map<
      string,
      { topic: string; attempted: number; wrong: number; level: string }
    >()
    for (const answer of answers) {
      const topic = answer.question.topic
      if (!topic) continue
      const entry = byTopic.get(topic) ?? {
        topic,
        attempted: 0,
        wrong: 0,
        level: answer.question.cefrLevel,
      }
      entry.attempted += 1
      if (!answer.isCorrect) entry.wrong += 1
      byTopic.set(topic, entry)
    }

    const weakTopics = [...byTopic.values()]
      .filter(
        (t) => t.wrong >= MIN_WRONG && t.wrong / t.attempted > 1 - WEAK_ACCURACY
      )
      .map((t) => ({
        ...t,
        accuracy: Math.round(((t.attempted - t.wrong) / t.attempted) * 100),
      }))
      .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)

    if (weakTopics.length === 0) {
      return NextResponse.json({
        weakTopics: [],
        courses: [],
        answered: answers.length,
        currentLevel: record?.currentLevel ?? 'A1',
      })
    }

    const weakKeys = weakTopics.map((t) => t.topic)

    // ดึงคอร์สที่มีแท็กหัวข้อ แล้วจับคู่ในหน่วยความจำ — TiDB/MySQL ค้นใน JSON array
    // ด้วย Prisma ตรง ๆ ไม่ได้ และจำนวนคอร์สยังอยู่ในหลักสิบ
    const candidates = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        minCefrLevel: true,
        duration: true,
        price: true,
        topics: true,
        isFocused: true,
        _count: { select: { videos: true } },
      },
    })

    const matched = candidates
      .map((course) => {
        const topics = Array.isArray(course.topics) ? (course.topics as string[]) : []
        const matchedTopics = topics.filter((t) => weakKeys.includes(t))
        const wrongCovered = matchedTopics.reduce(
          (sum, t) => sum + (byTopic.get(t)?.wrong ?? 0),
          0
        )
        return { course, matchedTopics, wrongCovered }
      })
      .filter((item) => item.matchedTopics.length > 0)
      // เรียงจากคอร์สที่ครอบคลุมข้อที่พลาดมากที่สุด และให้คอร์สเจาะหัวข้อมาก่อนคอร์สรวม
      .sort(
        (a, b) =>
          b.wrongCovered - a.wrongCovered ||
          Number(b.course.isFocused) - Number(a.course.isFocused) ||
          a.course.price - b.course.price
      )
      .slice(0, 6)

    return NextResponse.json({
      currentLevel: record?.currentLevel ?? 'A1',
      answered: answers.length,
      weakTopics,
      courses: matched.map((item) => ({
        ...item.course,
        videoCount: item.course._count.videos,
        matchedTopics: item.matchedTopics,
        wrongCovered: item.wrongCovered,
      })),
    })
  } catch (error) {
    console.error('Failed to build recommendations:', error)
    return NextResponse.json(
      { error: 'สร้างคำแนะนำไม่สำเร็จ' },
      { status: 500 }
    )
  }
}
