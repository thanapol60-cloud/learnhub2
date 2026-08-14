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

/**
 * ตรวจสิทธิ์ผู้ดูแลจากฐานข้อมูล ไม่ใช่จากค่าที่ไคลเอนต์ส่งมา
 *
 * เดิมฟังก์ชันนี้เชื่อคุกกี้ `userRole` ตรง ๆ ซึ่งเป็นคุกกี้ธรรมดาที่ไม่ได้เซ็นชื่อ
 * ใครก็ตามที่ตั้ง `userRole=admin` เองในเบราว์เซอร์จึงเข้าถึงคอนโซลผู้ดูแลได้ทั้งหมด
 * โดยไม่ต้องมีรหัสผ่าน (ยืนยันด้วยการทดสอบจริงแล้วว่าได้ HTTP 200)
 *
 * ตอนนี้อ่าน userId จากคุกกี้แล้วไปถามฐานข้อมูลว่าบัญชีนั้นเป็นผู้ดูแลจริงหรือไม่
 * ค่าที่ไคลเอนต์ปลอมได้จึงเหลือแค่ userId ซึ่งไม่มีความหมายถ้าบัญชีนั้นไม่ใช่ผู้ดูแล
 */
export async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ถ้าถามฐานข้อมูลไม่ได้ ต้องปฏิเสธ ไม่ใช่ปล่อยผ่าน
  // การตรวจสิทธิ์ที่ล้มเหลวแล้วอนุญาตคือช่องโหว่ที่ร้ายกว่าการที่ระบบใช้งานไม่ได้ชั่วคราว
  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
  } catch (error) {
    console.error('ตรวจสิทธิ์ผู้ดูแลไม่สำเร็จ:', error)
    return NextResponse.json(
      { error: 'ตรวจสอบสิทธิ์ไม่ได้ในขณะนี้' },
      { status: 503 }
    )
  }

  if (user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return null
}
