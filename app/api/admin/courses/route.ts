import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'
import { isSubjectKey, levelsOf } from '@/lib/subjects'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      subject,
      title,
      description,
      minCefrLevel,
      maxCefrLevel,
      instructorName,
      learningOutcomes,
      duration,
      price,
      videoIds,
    } = await request.json()

    if (!title || !description || !minCefrLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ไม่ระบุวิชาถือว่าเป็นภาษาอังกฤษ เพื่อให้ฟอร์มเดิมยังใช้ได้
    const courseSubject = isSubjectKey(subject) ? subject : 'english'
    if (!levelsOf(courseSubject).includes(minCefrLevel)) {
      return NextResponse.json(
        { error: `ระดับ ${minCefrLevel} ไม่ใช่ระดับของวิชานี้` },
        { status: 400 }
      )
    }

    const selectedVideoIds: string[] = Array.isArray(videoIds) ? videoIds : []

    const course = await prisma.course.create({
      data: {
        subject: courseSubject,
        title,
        description,
        minCefrLevel,
        maxCefrLevel: maxCefrLevel || null,
        instructorName,
        learningOutcomes,
        duration: duration || 0,
        price: Math.max(0, Number(price) || 0),
        createdById: user.id,
        content: { chapters: [] },
        // A course is a set of clips grouped together
        ...(selectedVideoIds.length > 0
          ? { videos: { connect: selectedVideoIds.map((id) => ({ id })) } }
          : {}),
      },
      include: {
        createdBy: { select: { name: true } },
        videos: { select: { id: true, title: true, duration: true } },
      },
    })

    return NextResponse.json(
      {
        course,
        message: 'Course created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      where: {
        createdById: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        videos: true,
        createdBy: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
