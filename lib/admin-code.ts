/**
 * รหัสยืนยันสำหรับสมัครบัญชีผู้ดูแลระบบ
 * ตั้งค่าทับได้ด้วย env ADMIN_REGISTER_CODE (แนะนำให้ตั้งบน Vercel)
 */
export const ADMIN_REGISTER_CODE =
  process.env.ADMIN_REGISTER_CODE || 'LEARNHUB-ADMIN-2026'

export function isValidAdminCode(code: unknown): boolean {
  return typeof code === 'string' && code.trim() === ADMIN_REGISTER_CODE
}
