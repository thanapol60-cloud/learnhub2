import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-middleware'
import { isSubjectKey, SUBJECTS } from '@/lib/subjects'
import { getProgress } from '@/lib/subject-progress'
import { assessWriting, countWords, MIN_WORDS, promptsForLevel } from '@/lib/ai/assess-writing'

export const dynamic = 'force-dynamic'

/** โจทย์เขียนที่เหมาะกับระดับปัจจุบันของผู้เรียน */
export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subjectParam = request.nextUrl.searchParams.get('subject') ?? 'english'
  if (!isSubjectKey(subjectParam)) {
    return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
  }

  const progress = await getProgress(user.id, subjectParam)
  const level = progress?.currentLevel ?? SUBJECTS[subjectParam].levels[0]

  return NextResponse.json({
    subject: subjectParam,
    level,
    levelDescription: SUBJECTS[subjectParam].levelDescriptions[level],
    prompts: promptsForLevel(subjectParam, level),
    minWords: MIN_WORDS,
  })
}

/** ตรวจงานเขียนแล้วให้ผลตอบกลับ */
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const subject = body?.subject ?? 'english'
    const prompt: string = String(body?.prompt ?? '').trim()
    const text: string = String(body?.text ?? '').trim()

    if (!isSubjectKey(subject)) {
      return NextResponse.json({ error: 'ไม่รู้จักวิชานี้' }, { status: 400 })
    }
    if (!prompt) {
      return NextResponse.json({ error: 'ต้องเลือกโจทย์ก่อน' }, { status: 400 })
    }

    const words = countWords(text, subject)
    if (words < MIN_WORDS) {
      // ตรวจความยาวก่อนเรียกโมเดล งานที่สั้นเกินไปประเมินไม่ได้อยู่แล้ว
      // จึงไม่ควรเสียค่าเรียกไปกับมัน
      return NextResponse.json(
        {
          error: `เขียนอย่างน้อย ${MIN_WORDS} คำจึงจะประเมินได้ ตอนนี้เขียนมาประมาณ ${words} คำ`,
        },
        { status: 400 }
      )
    }
    if (text.length > 3000) {
      return NextResponse.json(
        { error: 'งานเขียนยาวเกินไป กรุณาเขียนไม่เกิน 3,000 ตัวอักษร' },
        { status: 400 }
      )
    }

    const progress = await getProgress(user.id, subject)
    const currentLevel = progress?.currentLevel ?? SUBJECTS[subject].levels[0]

    const result = await assessWriting({
      subject,
      currentLevel,
      prompt,
      text,
      userId: user.id,
    })

    if (result.status !== 'ok' || !result.data) {
      return NextResponse.json({
        available: false,
        reason: result.status,
        message:
          result.status === 'no-key'
            ? 'ยังไม่ได้ตั้งค่า AI ในระบบ จึงตรวจงานเขียนไม่ได้ในขณะนี้'
            : result.message ?? 'ตรวจงานเขียนไม่สำเร็จ',
      })
    }

    return NextResponse.json({
      available: true,
      currentLevel,
      words,
      feedback: result.data,
      model: result.model,
    })
  } catch (error) {
    console.error('ตรวจงานเขียนไม่สำเร็จ:', error)
    return NextResponse.json({ error: 'ตรวจงานเขียนไม่สำเร็จ' }, { status: 500 })
  }
}
