import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'
import { levelsOf, SUBJECTS, SUBJECT_KEYS, SubjectKey } from '@/lib/subjects'

/** สรุปการกระจายระดับของผู้เรียนกลุ่มหนึ่ง */
function summarise(subject: SubjectKey, learnerLevels: string[]) {
  const levels = levelsOf(subject)
  const levelDistribution: Record<string, number> = Object.fromEntries(
    levels.map((level) => [level, 0])
  )

  for (const level of learnerLevels) {
    if (level in levelDistribution) levelDistribution[level] += 1
  }

  const assessed = learnerLevels.length
  // ระดับเฉลี่ยคิดจากตำแหน่งบนบันได แล้วปัดกลับเป็นชื่อระดับ
  const totalScore = Object.entries(levelDistribution).reduce(
    (sum, [level, count]) => sum + (levels.indexOf(level) + 1) * count,
    0
  )
  const averageIndex = assessed > 0 ? Math.round(totalScore / assessed) - 1 : 0
  const averageLevel = levels[Math.max(0, Math.min(levels.length - 1, averageIndex))]

  return {
    subject,
    name: SUBJECTS[subject].name,
    framework: SUBJECTS[subject].framework,
    levels,
    levelDistribution,
    assessed,
    averageLevel,
  }
}

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const totalUsers = await prisma.user.count({ where: { role: 'user' } })
    const enrollments = await prisma.courseEnrollment.count()

    // ภาษาอังกฤษอ่านจากตาราง User — นับเฉพาะคนที่ตอบข้อสอบไปแล้ว
    // ไม่งั้นคนที่เพิ่งสมัครจะไปกองอยู่ที่ A1 และทำให้การกระจายเพี้ยน
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      select: { currentLevel: true, correctAnswers: true, wrongAnswers: true },
    })
    const englishLevels = users
      .filter((u) => u.correctAnswers + u.wrongAnswers > 0)
      .map((u) => u.currentLevel)

    // วิชาอื่นอ่านจาก SubjectProgress
    const progressRows = await prisma.subjectProgress.findMany({
      where: { user: { role: 'user' } },
      select: {
        subject: true,
        currentLevel: true,
        correctAnswers: true,
        wrongAnswers: true,
      },
    })

    const subjects = SUBJECT_KEYS.map((key) => {
      if (key === 'english') return summarise(key, englishLevels)
      const levels = progressRows
        .filter((row) => row.subject === key && row.correctAnswers + row.wrongAnswers > 0)
        .map((row) => row.currentLevel)
      return summarise(key, levels)
    })

    // จำนวนการลงทะเบียนแยกตามวิชาของคอร์ส
    const enrollmentRows = await prisma.courseEnrollment.findMany({
      select: { course: { select: { subject: true } } },
    })
    const enrollmentsBySubject: Record<string, number> = Object.fromEntries(
      SUBJECT_KEYS.map((key) => [key, 0])
    )
    for (const row of enrollmentRows) {
      const key = row.course.subject ?? 'english'
      if (key in enrollmentsBySubject) enrollmentsBySubject[key] += 1
    }

    const english = subjects.find((s) => s.subject === 'english')!

    return NextResponse.json({
      totalUsers,
      courseEnrollments: enrollments,
      // ฟิลด์เดิมของภาษาอังกฤษ คงไว้เพื่อไม่ให้ผู้เรียกเดิมพัง
      averageLevel: english.averageLevel,
      assessmentsCompleted: english.assessed,
      levelDistribution: english.levelDistribution,
      // ข้อมูลรายวิชา
      subjects,
      enrollmentsBySubject,
    })
  } catch (error) {
    console.error('Failed to get analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}
