import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      minCefrLevel,
      maxCefrLevel,
      instructorName,
      learningOutcomes,
      duration,
    } = await request.json()

    if (!title || !description || !minCefrLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        minCefrLevel,
        maxCefrLevel,
        instructorName,
        learningOutcomes,
        duration: duration || 0,
        createdById: user.id,
        content: { chapters: [] },
      },
      include: {
        createdBy: {
          select: { name: true },
        },
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
