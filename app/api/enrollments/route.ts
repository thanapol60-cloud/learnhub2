import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { buildPaymentRef } from '@/lib/payment'

export const dynamic = 'force-dynamic'

/** คอร์สทั้งหมดที่ผู้ใช้ปัจจุบันลงทะเบียนไว้ */
export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: user.id },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            minCefrLevel: true,
            duration: true,
            instructorName: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Failed to list enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to list enrollments' },
      { status: 500 }
    )
  }
}

/** เริ่มลงทะเบียน: สร้างรายการรอชำระเงิน (หรือเปิดเรียนทันทีถ้าคอร์สฟรี) */
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json(
      { error: 'กรุณาเข้าสู่ระบบก่อนลงทะเบียนเรียน' },
      { status: 401 }
    )
  }

  try {
    const { courseId } = await request.json()
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'ไม่พบคอร์สนี้' }, { status: 404 })
    }

    const existing = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })

    if (existing) {
      return NextResponse.json({ enrollment: existing, existing: true })
    }

    const created = await prisma.courseEnrollment.create({
      data: {
        userId: user.id,
        courseId,
        amount: course.price,
        status: course.price > 0 ? 'awaiting_payment' : 'active',
      },
    })

    // รหัสอ้างอิงอิงจาก id ที่เพิ่งสร้าง จึงต้องอัปเดตอีกครั้ง
    const enrollment = await prisma.courseEnrollment.update({
      where: { id: created.id },
      data: { paymentRef: buildPaymentRef(created.id) },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error('Failed to enroll:', error)
    return NextResponse.json({ error: 'ลงทะเบียนไม่สำเร็จ' }, { status: 500 })
  }
}
