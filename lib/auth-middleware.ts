import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'

export async function getUser(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return user
  } catch (error) {
    return null
  }
}

export function requireAuth(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null
}

export function requireAdmin(request: NextRequest) {
  const userRole = request.cookies.get('userRole')?.value

  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return null
}
