import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * รายละเอียดคอร์สสำหรับผู้เรียน
 * ลิงก์วิดีโอจะถูกส่งกลับเฉพาะคนที่สิทธิ์เรียนเปิดแล้ว (หรือผู้ดูแล) — คนอื่นเห็นแค่รายชื่อบทเรียน
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request)

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        videos: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            videoUrl: true,
            adminLevel: true,
            suggestedLevel: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'ไม่พบคอร์สนี้' }, { status: 404 })
    }

    const enrollment = user
      ? await prisma.courseEnrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          select: {
            id: true,
            status: true,
            progress: true,
            amount: true,
            paymentRef: true,
          },
        })
      : null

    const unlocked = user?.role === 'admin' || enrollment?.status === 'active'

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        minCefrLevel: course.minCefrLevel,
        maxCefrLevel: course.maxCefrLevel,
        instructorName: course.instructorName,
        duration: course.duration,
        price: course.price,
        learningOutcomes: course.learningOutcomes,
        lessons: course.videos.map((video) => ({
          id: video.id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          level: video.adminLevel || video.suggestedLevel,
          // ล็อกไว้จนกว่าจะชำระเงินและได้รับอนุมัติ
          videoUrl: unlocked ? video.videoUrl : null,
        })),
      },
      enrollment,
      unlocked,
      signedIn: Boolean(user),
    })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json({ error: 'โหลดคอร์สไม่สำเร็จ' }, { status: 500 })
  }
}
