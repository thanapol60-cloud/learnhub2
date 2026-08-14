import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { checkLoginRate, recordLoginFailure, clearLoginFailures } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // ตรวจอัตราก่อนแตะฐานข้อมูลผู้ใช้ เพื่อไม่ให้การเดารหัสผ่านกินทรัพยากรฟรี
    const rate = await checkLoginRate(email)
    if (rate.blocked) {
      return NextResponse.json(
        {
          error: `พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารออีก ${Math.ceil(
            rate.retryAfterSeconds / 60
          )} นาที`,
        },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !verifyPassword(password, user.password)) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip')
      await recordLoginFailure(email, ip)
      // ข้อความเดียวกันทั้งกรณีไม่มีบัญชีและรหัสผ่านผิด
      // เพื่อไม่ให้ใช้หน้านี้ไล่ตรวจว่าอีเมลใดมีอยู่ในระบบ
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    await clearLoginFailures(email)

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: 'Login successful',
      },
      { status: 200 }
    )

    response.cookies.set('userId', user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set('userRole', user.role, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
