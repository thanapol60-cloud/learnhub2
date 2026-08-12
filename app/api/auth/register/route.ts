import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { isValidAdminCode } from '@/lib/admin-code'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, adminCode } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // บัญชีผู้ดูแลระบบต้องยืนยันด้วยรหัสที่ตั้งไว้เท่านั้น
    const wantsAdmin = role === 'admin'
    if (wantsAdmin && !isValidAdminCode(adminCode)) {
      return NextResponse.json(
        { error: 'รหัสผู้ดูแลระบบไม่ถูกต้อง' },
        { status: 403 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      )
    }

    const hashedPassword = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: wantsAdmin ? 'admin' : 'user',
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

    // ต้องมี userRole ด้วย ไม่งั้นผู้ดูแลที่เพิ่งสมัครจะเรียก API ฝั่งแอดมินไม่ได้
    response.cookies.set('userRole', user.role, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
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
