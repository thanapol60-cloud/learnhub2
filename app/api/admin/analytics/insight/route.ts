import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, getUser } from '@/lib/auth-middleware'
import { isSubjectKey, levelsOf } from '@/lib/subjects'
import { summariseAnalytics } from '@/lib/ai/analytics-insight'

export const dynamic = 'force-dynamic'

/**
 * ข้อสังเกตและข้อเสนอจากข้อมูลจริงของวิชาที่เลือก
 *
 * มาแทนการ์ดข้อความตายตัวในหน้าสถิติ ซึ่งเขียนไว้ในโค้ดและพูดเหมือนกันทุกวิชา
 * ทุกวัน ไม่ว่าตัวเลขจะเป็นอย่างไร
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const subjectParam = request.nextUrl.searchParams.get('subject') ?? 'english'
  if (!isSubjectKey(subjectParam)) {
    return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
  }
  const subject = subjectParam
  const levels = levelsOf(subject)

  try {
    const admin = await getUser(request)

    // การกระจายระดับ ใช้เงื่อนไขเดียวกับหน้าสถิติเพื่อให้ตัวเลขตรงกัน
    const levelDistribution: Record<string, number> = Object.fromEntries(
      levels.map((l) => [l, 0])
    )
    let assessed = 0

    if (subject === 'english') {
      const users = await prisma.user.findMany({
        where: { role: 'user' },
        select: { currentLevel: true, correctAnswers: true, wrongAnswers: true },
      })
      for (const u of users) {
        if (u.correctAnswers + u.wrongAnswers === 0) continue
        if (u.currentLevel in levelDistribution) levelDistribution[u.currentLevel] += 1
        assessed += 1
      }
    } else {
      const rows = await prisma.subjectProgress.findMany({
        where: { subject, user: { role: 'user' } },
        select: { currentLevel: true, correctAnswers: true, wrongAnswers: true },
      })
      for (const r of rows) {
        if (r.correctAnswers + r.wrongAnswers === 0) continue
        if (r.currentLevel in levelDistribution) levelDistribution[r.currentLevel] += 1
        assessed += 1
      }
    }

    const totalScore = Object.entries(levelDistribution).reduce(
      (sum, [level, count]) => sum + (levels.indexOf(level) + 1) * count,
      0
    )
    const averageIndex = assessed > 0 ? Math.round(totalScore / assessed) - 1 : 0
    const averageLevel = levels[Math.max(0, Math.min(levels.length - 1, averageIndex))]

    // จำนวนข้อสอบต่อระดับ ใช้ดูว่าคลังบางระดับบางเกินไปจนวัดไม่แม่นหรือไม่
    const questionRows = await prisma.question.groupBy({
      by: ['cefrLevel'],
      where: { subject },
      _count: true,
    })
    const questionsPerLevel: Record<string, number> = Object.fromEntries(
      levels.map((l) => [l, 0])
    )
    for (const row of questionRows) {
      if (row.cefrLevel in questionsPerLevel) questionsPerLevel[row.cefrLevel] = row._count
    }

    // หัวข้อที่ผู้เรียนพลาดมากที่สุดทั้งระบบ
    const records = await prisma.assessmentRecord.findMany({
      where: { question: { subject }, user: { role: 'user' } },
      select: { isCorrect: true, question: { select: { topic: true } } },
      take: 5000, // พอสำหรับหาแนวโน้ม โดยไม่ดึงทั้งตาราง
    })
    const topicStats = new Map<string, { wrong: number; attempted: number }>()
    for (const r of records) {
      const topic = r.question.topic
      if (!topic) continue
      const stat = topicStats.get(topic) ?? { wrong: 0, attempted: 0 }
      stat.attempted += 1
      if (!r.isCorrect) stat.wrong += 1
      topicStats.set(topic, stat)
    }
    const weakestTopics = [...topicStats.entries()]
      .filter(([, s]) => s.attempted >= 3)
      .map(([topic, s]) => ({ topic, ...s }))
      .sort((a, b) => b.wrong / b.attempted - a.wrong / a.attempted)
      .slice(0, 6)

    const enrollments = await prisma.courseEnrollment.count({
      where: { course: { subject } },
    })

    const result = await summariseAnalytics({
      subject,
      levelDistribution,
      assessed,
      averageLevel,
      enrollments,
      weakestTopics,
      questionsPerLevel,
      userId: admin?.id,
    })

    if (result.status !== 'ok' || !result.data) {
      return NextResponse.json({
        available: false,
        reason: result.status,
        message: result.message,
      })
    }

    return NextResponse.json({
      available: true,
      subject,
      insight: result.data,
      model: result.model,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('สรุปสถิติไม่สำเร็จ:', error)
    return NextResponse.json({ error: 'สรุปสถิติไม่สำเร็จ' }, { status: 500 })
  }
}
