import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { matchFaq } from '@/lib/chat-faq'
import { answerQuestion } from '@/lib/ai/chatbot'
import { SUBJECTS, SubjectKey, SUBJECT_KEYS } from '@/lib/subjects'
import { statusLabel } from '@/lib/enrollment-status'

export const dynamic = 'force-dynamic'

/**
 * แชทบอทสามชั้น
 *
 *   ชั้น 1  คำถามเกี่ยวกับข้อมูลของผู้ถามเอง → ตอบจากฐานข้อมูล   (0 โทเคน)
 *   ชั้น 2  คำถามที่พบบ่อย                  → ตอบจากคลัง FAQ    (0 โทเคน)
 *   ชั้น 3  ที่เหลือ                        → เรียก AI
 *
 * เรียงแบบนี้เพราะคำถามส่วนใหญ่ตอบได้โดยไม่ต้องใช้โมเดล และคำตอบที่มาจาก
 * ฐานข้อมูลหรือข้อความที่เขียนไว้จะถูกต้องเสมอ ต่างจากคำตอบที่โมเดลเดาขึ้นมา
 */

/** คำที่บ่งชี้ว่าผู้ถามกำลังถามถึงข้อมูลของตัวเอง */
const SELF_LEVEL = ['ระดับของฉัน', 'ระดับฉัน', 'ฉันอยู่ระดับ', 'ผมอยู่ระดับ', 'หนูอยู่ระดับ', 'ระดับตัวเอง', 'ได้ระดับอะไร']
const SELF_COURSES = ['คอร์สของฉัน', 'ฉันลงทะเบียน', 'ลงคอร์สอะไร', 'คอร์สที่ลง', 'สถานะการจ่าย', 'จ่ายเงินไปแล้ว']

function answerFromData(
  question: string,
  data: {
    levels: Array<{ subject: SubjectKey; level: string; answered: number }>
    enrollments: Array<{ title: string; status: string }>
  }
): { answer: string; link?: { label: string; href: string } } | null {
  const text = question.replace(/\s+/g, '')

  if (SELF_LEVEL.some((k) => text.includes(k.replace(/\s+/g, '')))) {
    const assessed = data.levels.filter((l) => l.answered > 0)
    if (assessed.length === 0) {
      return {
        answer: 'คุณยังไม่ได้ทำแบบประเมินเลย ลองเริ่มจากวิชาที่สนใจได้ที่หน้าแรก ใช้เวลาประมาณ 15 นาทีต่อวิชา',
        link: { label: 'เริ่มทำแบบประเมิน', href: '/' },
      }
    }
    const lines = assessed
      .map((l) => `${SUBJECTS[l.subject].name}: ${l.level} (${SUBJECTS[l.subject].levelDescriptions[l.level]})`)
      .join(' · ')
    const notYet = data.levels.filter((l) => l.answered === 0)
    return {
      answer:
        `ระดับปัจจุบันของคุณคือ ${lines}` +
        (notYet.length
          ? ` ส่วนวิชา${notYet.map((l) => SUBJECTS[l.subject].name).join(' และ ')} ยังไม่ได้ประเมิน`
          : ''),
      link: { label: 'ดูความก้าวหน้า', href: '/dashboard' },
    }
  }

  if (SELF_COURSES.some((k) => text.includes(k.replace(/\s+/g, '')))) {
    if (data.enrollments.length === 0) {
      return {
        answer: 'คุณยังไม่ได้ลงทะเบียนคอร์สใด ลองทำแบบประเมินก่อน แล้วระบบจะแนะนำคอร์สที่ตรงกับจุดที่ควรซ่อม',
        link: { label: 'ดูคอร์สเรียน', href: '/courses' },
      }
    }
    const lines = data.enrollments
      .map((e) => `${e.title} — ${statusLabel(e.status)}`)
      .join(' · ')
    return {
      answer: `คุณลงทะเบียนไว้ ${data.enrollments.length} คอร์ส: ${lines}`,
      link: { label: 'ไปหน้าความก้าวหน้า', href: '/dashboard' },
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const question: string = String(body?.question ?? '').trim()
    const history = Array.isArray(body?.history) ? body.history : []

    if (!question) {
      return NextResponse.json({ error: 'กรุณาพิมพ์คำถาม' }, { status: 400 })
    }
    if (question.length > 500) {
      return NextResponse.json(
        { error: 'คำถามยาวเกินไป กรุณาถามให้สั้นลง' },
        { status: 400 }
      )
    }

    const user = await getUser(request)

    // ---- ชั้น 1: ตอบจากข้อมูลของผู้ถามเอง ----
    if (user) {
      const [record, progress, enrollments] = await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: { currentLevel: true, correctAnswers: true, wrongAnswers: true },
        }),
        prisma.subjectProgress.findMany({
          where: { userId: user.id },
          select: { subject: true, currentLevel: true, correctAnswers: true, wrongAnswers: true },
        }),
        prisma.courseEnrollment.findMany({
          where: { userId: user.id },
          select: { status: true, course: { select: { title: true } } },
          orderBy: { enrolledAt: 'desc' },
          take: 10,
        }),
      ])

      const levels = SUBJECT_KEYS.map((key) => {
        if (key === 'english') {
          return {
            subject: key,
            level: record?.currentLevel ?? 'A1',
            answered: (record?.correctAnswers ?? 0) + (record?.wrongAnswers ?? 0),
          }
        }
        const row = progress.find((p) => p.subject === key)
        return {
          subject: key,
          level: row?.currentLevel ?? SUBJECTS[key].levels[0],
          answered: (row?.correctAnswers ?? 0) + (row?.wrongAnswers ?? 0),
        }
      })

      const enrollmentList = enrollments.map((e) => ({
        title: e.course.title,
        status: e.status,
      }))

      const fromData = answerFromData(question, { levels, enrollments: enrollmentList })
      if (fromData) {
        return NextResponse.json({
          answer: fromData.answer,
          link: fromData.link,
          source: 'data',
          usedAI: false,
        })
      }

      // ---- ชั้น 2: FAQ ----
      const faq = matchFaq(question)
      if (faq) {
        return NextResponse.json({
          answer: faq.entry.answer,
          link: faq.entry.link,
          source: 'faq',
          usedAI: false,
        })
      }

      // ---- ชั้น 3: AI ----
      const result = await answerQuestion({
        question,
        history,
        userId: user.id,
        context: {
          levels: levels
            .filter((l) => l.answered > 0)
            .map((l) => ({ subject: SUBJECTS[l.subject].name, level: l.level })),
          enrollments: enrollmentList.map((e) => ({
            title: e.title,
            status: statusLabel(e.status),
          })),
        },
      })

      if (result.status === 'ok' && result.data) {
        return NextResponse.json({
          answer: result.data.answer,
          answered: result.data.answered,
          source: 'ai',
          usedAI: true,
        })
      }

      return NextResponse.json({
        answer:
          result.status === 'no-key'
            ? 'ขออภัย ยังตอบคำถามนี้ไม่ได้ ลองถามด้วยคำอื่น หรือดูคำถามที่พบบ่อยด้านล่าง'
            : 'ขออภัย เกิดข้อผิดพลาดชั่วคราว ลองใหม่อีกครั้ง',
        source: 'fallback',
        usedAI: false,
      })
    }

    // ---- ผู้ที่ยังไม่ได้เข้าสู่ระบบ: ตอบได้เฉพาะ FAQ ----
    // ไม่เปิดให้เรียก AI โดยไม่ล็อกอิน เพราะเป็นค่าใช้จ่ายที่ใครก็กดได้ไม่จำกัด
    const faq = matchFaq(question)
    if (faq) {
      return NextResponse.json({
        answer: faq.entry.answer,
        link: faq.entry.link,
        source: 'faq',
        usedAI: false,
      })
    }

    return NextResponse.json({
      answer:
        'กรุณาเข้าสู่ระบบเพื่อถามคำถามเพิ่มเติม หรือลองเลือกจากคำถามที่พบบ่อยด้านล่างได้เลย',
      link: { label: 'เข้าสู่ระบบ', href: '/login' },
      source: 'fallback',
      usedAI: false,
    })
  } catch (error) {
    console.error('แชทบอทตอบไม่สำเร็จ:', error)
    return NextResponse.json({ error: 'ตอบคำถามไม่สำเร็จ' }, { status: 500 })
  }
}
