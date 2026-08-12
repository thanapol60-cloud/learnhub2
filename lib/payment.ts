import generatePayload from 'promptpay-qr'

/**
 * ฝั่งเซิร์ฟเวอร์เท่านั้น — ไฟล์นี้ดึง promptpay-qr ซึ่งเป็นโมดูลของ Node
 * ป้ายสถานะที่หน้าเว็บใช้ อยู่ที่ lib/enrollment-status.ts
 */

/** บัญชีพร้อมเพย์ที่ใช้รับชำระเงิน — ตั้งค่าทับได้ด้วย env PROMPTPAY_ID */
export const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0910391036'
export const PROMPTPAY_NAME = process.env.PROMPTPAY_NAME || 'LearnHub'

/**
 * สร้าง payload มาตรฐาน EMVCo สำหรับพร้อมเพย์
 * amount = 0 หมายถึง QR ที่ไม่ระบุจำนวนเงิน
 */
export function buildPromptPayPayload(amount: number): string {
  return amount > 0
    ? generatePayload(PROMPTPAY_ID, { amount })
    : generatePayload(PROMPTPAY_ID, {})
}

/** รหัสอ้างอิงที่ผู้เรียนใช้แจ้งโอน อ่านง่ายและไม่ซ้ำกันในทางปฏิบัติ */
export function buildPaymentRef(enrollmentId: string): string {
  const tail = enrollmentId.slice(-6).toUpperCase()
  return `LH-${tail}`
}
