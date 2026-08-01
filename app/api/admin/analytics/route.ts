import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const totalUsers = await prisma.user.count({
      where: { role: 'user' },
    })

    const enrollments = await prisma.courseEnrollment.count()

    // Calculate level distribution
    const levelDistribution: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    }

    const users = await prisma.user.findMany({
      where: { role: 'user' },
      select: { currentLevel: true },
    })

    users.forEach((user) => {
      if (levelDistribution.hasOwnProperty(user.currentLevel)) {
        levelDistribution[user.currentLevel]++
      }
    })

    // Calculate average level
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    let totalScore = 0
    Object.entries(levelDistribution).forEach(([level, count]) => {
      totalScore += (levels.indexOf(level) + 1) * count
    })
    const averageIndex =
      totalUsers > 0 ? Math.round(totalScore / totalUsers) - 1 : 0
    const averageLevel = levels[Math.max(0, Math.min(5, averageIndex))]

    return NextResponse.json({
      totalUsers,
      averageLevel,
      assessmentsCompleted: users.length,
      courseEnrollments: enrollments,
      levelDistribution,
    })
  } catch (error) {
    console.error('Failed to get analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}
