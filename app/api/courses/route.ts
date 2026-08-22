import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// ต้องอ่านฐานข้อมูลใหม่ทุกครั้งที่เรียก
//
// Next.js ถือว่า GET ที่ไม่ได้ใช้ request, cookies หรือ headers เป็นเส้นทางแบบคงที่
// แล้วรันมันตอน build ครั้งเดียว จากนั้นเสิร์ฟผลเดิมตลอด
// คอร์สที่ผู้ดูแลสร้างหลัง build จึงไม่เคยขึ้นในหน้า /courses เลย
// (เส้นทางอื่นรับ request เป็นพารามิเตอร์อยู่แล้วจึงเป็นแบบไดนามิกโดยอัตโนมัติ
//  เหลือเส้นทางนี้เส้นทางเดียวที่ตกหล่น)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: { videos: { select: { id: true, title: true, duration: true } } },
      orderBy: { minCefrLevel: 'asc' },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to get courses:', error)
    return NextResponse.json(
      { error: 'Failed to get courses' },
      { status: 500 }
    )
  }
}
