import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { describeLevel, isSubjectKey, levelsOf, SUBJECTS } from '@/lib/subjects'
import { getProgress, markCompleted } from '@/lib/subject-progress'

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

    const progress = await getProgress(user.id, subject)
    if (!progress) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In an adaptive test the level reached is the result; raw accuracy hovers
    // near the pass mark by design because difficulty tracks the learner.
    const level = progress.currentLevel
    const totalAnswers = progress.correctAnswers + progress.wrongAnswers
    const accuracy =
      totalAnswers > 0
        ? Math.round((progress.correctAnswers / totalAnswers) * 100)
        : 0

    // Courses at the learner's level, plus the level below as reinforcement
    const levels = levelsOf(subject)
    const levelIndex = levels.indexOf(level)
    const relevantLevels = [level]
    if (levelIndex > 0) relevantLevels.push(levels[levelIndex - 1])

    const recommendations = await prisma.course.findMany({
      where: { subject, minCefrLevel: { in: relevantLevels } },
      include: { videos: { select: { id: true, title: true, duration: true } } },
      orderBy: { minCefrLevel: 'desc' },
    })

    await markCompleted(user.id, subject)

    return NextResponse.json({
      subject,
      subjectName: SUBJECTS[subject].name,
      framework: SUBJECTS[subject].framework,
      // ชื่อเดิม cefrLevel ยังส่งไปด้วยเพื่อไม่ให้หน้าเดิมพัง
      cefrLevel: level,
      level,
      levelDescription: describeLevel(subject, level),
      totalQuestions: totalAnswers,
      correctAnswers: progress.correctAnswers,
      accuracy,
      recommendations,
    })
  } catch (error) {
    console.error('Failed to get result:', error)
    return NextResponse.json(
      { error: 'Failed to get result' },
      { status: 500 }
    )
  }
}
