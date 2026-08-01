import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getNextLevel } from '@/lib/assessment'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const nextLevel = getNextLevel(user.currentLevel)
    if (!nextLevel) {
      return NextResponse.json(
        { error: 'Already at maximum level' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLevel: nextLevel,
        correctAnswers: 0,
        wrongAnswers: 0,
      },
    })

    return NextResponse.json({
      newLevel: nextLevel,
      message: 'Level advanced successfully',
    })
  } catch (error) {
    console.error('Failed to advance level:', error)
    return NextResponse.json(
      { error: 'Failed to advance level' },
      { status: 500 }
    )
  }
}
