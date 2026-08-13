import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { PROMPTPAY_ID, PROMPTPAY_NAME } from '@/lib/payment'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            minCefrLevel: true,
            duration: true,
            instructorName: true,
            price: true,
          },
        },
      },
    })

    if (!enrollment || (enrollment.userId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'ไม่พบรายการลงทะเบียน' }, { status: 404 })
    }

    return NextResponse.json({
      enrollment,
      payment: { promptPayId: PROMPTPAY_ID, promptPayName: PROMPTPAY_NAME },
    })
  } catch (error) {
    console.error('Failed to get enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to get enrollment' },
      { status: 500 }
    )
  }
}

/**
 * ผู้เรียนแจ้งว่าโอนเงินแล้ว — เข้าคิวรอผู้ดูแลตรวจสอบ
 * และเมื่อสิทธิ์เปิดแล้ว ใช้บันทึกความคืบหน้าการเรียน (progress 0–100)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { paymentNote, progress } = await request.json()

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: params.id },
    })

    if (!enrollment || enrollment.userId !== user.id) {
      return NextResponse.json({ error: 'ไม่พบรายการลงทะเบียน' }, { status: 404 })
    }

    if (typeof progress === 'number') {
      const clamped = Math.max(0, Math.min(100, Math.round(progress)))
      const updated = await prisma.courseEnrollment.update({
        where: { id: params.id },
        data: {
          progress: clamped,
          completedAt: clamped >= 100 ? enrollment.completedAt ?? new Date() : null,
        },
      })
      return NextResponse.json({ enrollment: updated })
    }

    if (enrollment.status === 'active') {
      return NextResponse.json({ enrollment })
    }

    const updated = await prisma.courseEnrollment.update({
      where: { id: params.id },
      data: {
        status: 'pending_review',
        paidAt: new Date(),
        paymentNote: typeof paymentNote === 'string' ? paymentNote.slice(0, 500) : null,
      },
    })

    return NextResponse.json({ enrollment: updated })
  } catch (error) {
    console.error('Failed to report payment:', error)
    return NextResponse.json({ error: 'แจ้งชำระเงินไม่สำเร็จ' }, { status: 500 })
  }
}

/** ผู้เรียนยกเลิกรายการที่ยังไม่ได้ชำระ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: params.id },
    })

    if (!enrollment || enrollment.userId !== user.id) {
      return NextResponse.json({ error: 'ไม่พบรายการลงทะเบียน' }, { status: 404 })
    }

    if (enrollment.status === 'active') {
      return NextResponse.json(
        { error: 'คอร์สนี้เปิดเรียนแล้ว ไม่สามารถยกเลิกเองได้' },
        { status: 400 }
      )
    }

    await prisma.courseEnrollment.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to cancel enrollment:', error)
    return NextResponse.json({ error: 'ยกเลิกไม่สำเร็จ' }, { status: 500 })
  }
}
