import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/** ผู้ดูแลอนุมัติหรือปฏิเสธการชำระเงินของรายการลงทะเบียน */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { action } = await request.json()

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const enrollment = await prisma.courseEnrollment.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'active' : 'rejected',
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Failed to review enrollment:', error)
    return NextResponse.json(
      { error: 'อัปเดตสถานะไม่สำเร็จ' },
      { status: 500 }
    )
  }
}

/** ลบรายการลงทะเบียนออกจากระบบ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    await prisma.courseEnrollment.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete enrollment:', error)
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 })
  }
}
