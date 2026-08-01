import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role === 'admin' ? 'admin' : 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    const response = NextResponse.json(
      { user, message: 'User registered successfully' },
      { status: 201 }
    )

    response.cookies.set('userId', user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Register failed:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
