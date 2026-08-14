import { prisma } from './db'

/**
 * จำกัดจำนวนครั้งการเข้าสู่ระบบที่ล้มเหลว
 *
 * เพิ่มหลังจากชุดทดสอบความปลอดภัยพบว่าเดารหัสผ่านผิดติดกัน 12 ครั้งได้โดยไม่ถูกขวาง
 * (scripts/security-test.mjs กรณี E3) ซึ่งเปิดทางให้เดารหัสผ่านด้วยเครื่องมืออัตโนมัติ
 *
 * เก็บสถิติในฐานข้อมูลแทนหน่วยความจำ เพราะบนแพลตฟอร์มแบบไร้เซิร์ฟเวอร์
 * แต่ละคำขออาจถูกส่งไปคนละอินสแตนซ์ ตัวนับในหน่วยความจำจึงไม่เห็นกันและกัน
 */

const MAX_FAILURES = 5
const WINDOW_MINUTES = 15

export interface RateLimitVerdict {
  blocked: boolean
  remaining: number
  retryAfterSeconds: number
}

const windowStart = () => new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

/** เรียกก่อนตรวจรหัสผ่าน เพื่อไม่ให้เสียเวลาแฮชรหัสให้กับคำขอที่ควรถูกปฏิเสธอยู่แล้ว */
export async function checkLoginRate(email: string): Promise<RateLimitVerdict> {
  try {
    const failures = await prisma.loginAttempt.count({
      where: { email: email.toLowerCase(), createdAt: { gte: windowStart() } },
    })
    return {
      blocked: failures >= MAX_FAILURES,
      remaining: Math.max(0, MAX_FAILURES - failures),
      retryAfterSeconds: WINDOW_MINUTES * 60,
    }
  } catch (error) {
    // ถ้าตรวจไม่ได้ ให้ผ่านไปก่อน — การล็อกผู้ใช้ทุกคนออกจากระบบเพราะตารางบันทึกมีปัญหา
    // เสียหายมากกว่าการปล่อยให้เดารหัสผ่านต่อได้ชั่วคราว ซึ่งยังมีรหัสผ่านเป็นด่านอยู่
    console.error('ตรวจอัตราการเข้าสู่ระบบไม่สำเร็จ:', error)
    return { blocked: false, remaining: MAX_FAILURES, retryAfterSeconds: 0 }
  }
}

export async function recordLoginFailure(email: string, ip?: string | null): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { email: email.toLowerCase(), ip: ip ?? undefined },
    })
  } catch (error) {
    console.error('บันทึกการเข้าสู่ระบบที่ล้มเหลวไม่สำเร็จ:', error)
  }
}

/** ล้างประวัติเมื่อเข้าสู่ระบบสำเร็จ เจ้าของบัญชีตัวจริงจึงไม่ถูกล็อกจากการพิมพ์ผิดก่อนหน้า */
export async function clearLoginFailures(email: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({ where: { email: email.toLowerCase() } })
  } catch (error) {
    console.error('ล้างประวัติการเข้าสู่ระบบไม่สำเร็จ:', error)
  }
}
