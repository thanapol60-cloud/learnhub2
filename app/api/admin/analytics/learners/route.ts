import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'
import { isSubjectKey, levelsOf } from '@/lib/subjects'

export const dynamic = 'force-dynamic'

/**
 * รายชื่อผู้เรียนที่อยู่ในระดับหนึ่งของวิชาหนึ่ง
 *
 *   GET /api/admin/analytics/learners?subject=math&level=M3
 *
 * ดึงตอนที่แอดมินคลิกชิ้นส่วนในโดนัท จึงไม่ต้องส่งรายชื่อทั้งหมดมาพร้อมหน้าสถิติ
 * เงื่อนไข "ตอบไปแล้วอย่างน้อยหนึ่งข้อ" ต้องตรงกับที่หน้าสถิตินับ ไม่งั้นจำนวนจะไม่ตรงกัน
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  const subject = request.nextUrl.searchParams.get('subject') ?? 'english'
  const level = request.nextUrl.searchParams.get('level')

  if (!isSubjectKey(subject)) {
    return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
  }
  if (!level || !levelsOf(subject).includes(level)) {
    return NextResponse.json({ error: 'ไม่รู้จักระดับนี้' }, { status: 400 })
  }

  try {
    if (subject === 'english') {
      const users = await prisma.user.findMany({
        where: { role: 'user', currentLevel: level },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          correctAnswers: true,
          wrongAnswers: true,
          _count: { select: { enrolledCourses: true } },
        },
      })

      const learners = users
        .filter((u) => u.correctAnswers + u.wrongAnswers > 0)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          correctAnswers: u.correctAnswers,
          answered: u.correctAnswers + u.wrongAnswers,
          accuracy: Math.round(
            (u.correctAnswers / (u.correctAnswers + u.wrongAnswers)) * 100
          ),
          enrollments: u._count.enrolledCourses,
        }))

      return NextResponse.json({ subject, level, learners })
    }

    const rows = await prisma.subjectProgress.findMany({
      where: { subject, currentLevel: level, user: { role: 'user' } },
      select: {
        correctAnswers: true,
        wrongAnswers: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { enrolledCourses: true } },
          },
        },
      },
    })

    const learners = rows
      .filter((row) => row.correctAnswers + row.wrongAnswers > 0)
      .map((row) => ({
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        correctAnswers: row.correctAnswers,
        answered: row.correctAnswers + row.wrongAnswers,
        accuracy: Math.round(
          (row.correctAnswers / (row.correctAnswers + row.wrongAnswers)) * 100
        ),
        enrollments: row.user._count.enrolledCourses,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))

    return NextResponse.json({ subject, level, learners })
  } catch (error) {
    console.error('Failed to list learners:', error)
    return NextResponse.json({ error: 'ดึงรายชื่อผู้เรียนไม่สำเร็จ' }, { status: 500 })
  }
}
