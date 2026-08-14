import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/** รายชื่อนักเรียนทั้งหมด พร้อมคอร์สที่ลงทะเบียนและสถานะการชำระเงิน */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const students = await prisma.user.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        currentLevel: true,
        correctAnswers: true,
        wrongAnswers: true,
        createdAt: true,
        // ระดับของวิชาอื่น — ผู้เรียนบางคนสอบเฉพาะคณิตหรือวิทย์ ยังไม่เคยสอบภาษาอังกฤษ
        subjectProgress: {
          select: {
            subject: true,
            currentLevel: true,
            correctAnswers: true,
            wrongAnswers: true,
          },
        },
        enrolledCourses: {
          orderBy: { enrolledAt: 'desc' },
          select: {
            id: true,
            status: true,
            amount: true,
            paymentRef: true,
            paymentNote: true,
            paidAt: true,
            enrolledAt: true,
            reviewedAt: true,
            progress: true,
            course: {
              select: {
                id: true,
                subject: true,
                title: true,
                minCefrLevel: true,
                price: true,
              },
            },
          },
        },
      },
    })

    const summary = {
      totalStudents: students.length,
      totalEnrollments: students.reduce(
        (sum, s) => sum + s.enrolledCourses.length,
        0
      ),
      pendingReview: students.reduce(
        (sum, s) =>
          sum + s.enrolledCourses.filter((e) => e.status === 'pending_review').length,
        0
      ),
      revenue: students.reduce(
        (sum, s) =>
          sum +
          s.enrolledCourses
            .filter((e) => e.status === 'active')
            .reduce((acc, e) => acc + e.amount, 0),
        0
      ),
    }

    return NextResponse.json({ students, summary })
  } catch (error) {
    console.error('Failed to list students:', error)
    return NextResponse.json(
      { error: 'Failed to list students' },
      { status: 500 }
    )
  }
}
