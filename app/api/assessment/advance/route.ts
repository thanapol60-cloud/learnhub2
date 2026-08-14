import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isSubjectKey } from '@/lib/subjects'
import { getProgress, nextLevelOf, setLevel } from '@/lib/subject-progress'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const subject = body?.subject ?? 'english'
    if (!isSubjectKey(subject)) {
      return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
    }

    const progress = await getProgress(userId, subject)
    if (!progress) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const nextLevel = nextLevelOf(subject, progress.currentLevel)
    if (!nextLevel) {
      return NextResponse.json(
        { error: 'Already at maximum level' },
        { status: 400 }
      )
    }

    await setLevel(userId, subject, nextLevel)

    return NextResponse.json({
      subject,
      newLevel: nextLevel,
      message: 'Level advanced successfully',
    })
  } catch (error) {
    console.error('Failed to advance level:', error)
    return NextResponse.json(
      { error: 'Failed to advance level' },
      { status: 500 }
    )
  }
}
