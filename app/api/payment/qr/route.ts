import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'
import { buildPromptPayPayload } from '@/lib/payment'

export const dynamic = 'force-dynamic'

/**
 * คืน QR พร้อมเพย์เป็น SVG ตามยอดของรายการลงทะเบียนนั้น
 * ยอดเงินอ่านจากฐานข้อมูลเสมอ เพื่อไม่ให้ฝั่งผู้ใช้กำหนดเองได้
 */
export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enrollmentId = request.nextUrl.searchParams.get('enrollmentId')
  if (!enrollmentId) {
    return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 })
  }

  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true, amount: true },
    })

    if (!enrollment || (enrollment.userId !== user.id && user.role !== 'admin')) {
      return NextResponse.json({ error: 'ไม่พบรายการลงทะเบียน' }, { status: 404 })
    }

    const payload = buildPromptPayPayload(enrollment.amount)
    const svg = await QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      width: 320,
      color: { dark: '#101d33', light: '#ffffff' },
    })

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Failed to render QR:', error)
    return NextResponse.json({ error: 'สร้าง QR ไม่สำเร็จ' }, { status: 500 })
  }
}
