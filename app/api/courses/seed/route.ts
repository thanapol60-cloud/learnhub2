import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'
import { SEED_COURSES } from '@/lib/seed-data'

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const force = request.nextUrl.searchParams.get('force') === 'true'
    const existingCount = await prisma.course.count()

    if (existingCount > 0 && !force) {
      return NextResponse.json({
        message: 'Courses already exist. Pass ?force=true to replace them.',
        count: existingCount,
      })
    }

    if (force) {
      await prisma.video.deleteMany()
      await prisma.course.deleteMany()
    }

    let videoCount = 0

    for (const seed of SEED_COURSES) {
      const course = await prisma.course.create({
        data: {
          title: seed.title,
          description: seed.description,
          minCefrLevel: seed.cefrLevel,
          maxCefrLevel: seed.cefrLevel,
          instructorName: seed.instructorName,
          duration: seed.duration,
          learningOutcomes: seed.learningOutcomes,
          createdById: user.id,
          content: { chapters: [] },
        },
      })

      // Placeholder clips so each course has content to show
      await prisma.video.createMany({
        data: seed.videos.map((video) => ({
          title: video.title,
          description: video.description,
          videoUrl: `https://example.com/learnhub/${seed.cefrLevel.toLowerCase()}/${video.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`,
          duration: video.minutes * 60,
          uploadedById: user.id,
          suggestedLevel: seed.cefrLevel,
          adminLevel: seed.cefrLevel,
          analyzed: true,
          analysisSummary: `ตัวอย่างสำหรับทดสอบระบบ กำหนดระดับ ${seed.cefrLevel} ไว้ล่วงหน้า`,
          courseId: course.id,
        })),
      })

      videoCount += seed.videos.length
    }

    return NextResponse.json({
      message: 'Courses and placeholder videos seeded successfully',
      courses: SEED_COURSES.length,
      videos: videoCount,
    })
  } catch (error) {
    console.error('Failed to seed courses:', error)
    return NextResponse.json(
      { error: 'Failed to seed courses' },
      { status: 500 }
    )
  }
}
