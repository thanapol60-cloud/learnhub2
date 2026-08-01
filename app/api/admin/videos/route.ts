import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'
import { analyzeVideoLevel } from '@/lib/ai-analysis'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, videoUrl, duration } = await request.json()

    if (!title || !videoUrl || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        duration,
        uploadedById: user.id,
      },
    })

    // Run AI analysis
    const analysis = await analyzeVideoLevel({
      title,
      description,
      duration,
    })

    // Update video with analysis results
    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        suggestedLevel: analysis.suggestedLevel,
        analysisSummary: analysis.reasoning,
        analyzed: true,
      },
    })

    return NextResponse.json(
      {
        video: updatedVideo,
        analysis,
        message: 'Video uploaded and analyzed successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to upload video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
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

    const videos = await prisma.video.findMany({
      where: {
        uploadedById: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}
