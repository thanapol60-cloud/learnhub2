import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-middleware'
import { isSubjectKey, SUBJECTS } from '@/lib/subjects'
import { startAttempt } from '@/lib/subject-progress'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Please log in before starting an assessment' },
        { status: 401 }
      )
    }

    // ไม่ส่ง subject มาถือว่าเป็นภาษาอังกฤษ เพื่อให้ไคลเอนต์เดิมยังทำงานได้
    const body = await request.json().catch(() => ({}))
    const subject = body?.subject ?? 'english'
    if (!isSubjectKey(subject)) {
      return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
    }

    // ล้างสถิติของวิชานั้นให้เริ่มจากระดับแรกใหม่
    // assessmentStartedAt เป็นตัวแบ่งว่าคำตอบไหนอยู่ในรอบนี้ จึงกันข้อซ้ำได้
    await startAttempt(user.id, subject)

    return NextResponse.json({
      userId: user.id,
      subject,
      startLevel: SUBJECTS[subject].levels[0],
      message: 'Assessment started',
    })
  } catch (error) {
    console.error('Failed to start assessment:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}
