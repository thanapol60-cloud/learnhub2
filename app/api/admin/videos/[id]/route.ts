import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { adminLevel, courseId } = await request.json()

    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.uploadedById !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this video' },
        { status: 403 }
      )
    }

    const updatedVideo = await prisma.video.update({
      where: { id: params.id },
      data: {
        adminLevel,
        courseId: courseId || null,
      },
    })

    return NextResponse.json({
      video: updatedVideo,
      message: 'Video updated successfully',
    })
  } catch (error) {
    console.error('Failed to update video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.uploadedById !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this video' },
        { status: 403 }
      )
    }

    await prisma.video.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
