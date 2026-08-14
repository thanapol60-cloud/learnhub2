/** @type {import('next').NextConfig} */

/**
 * Security header ที่ตั้งให้ทุกเส้นทาง
 * เพิ่มหลังจากชุดทดสอบความปลอดภัย (scripts/security-test.mjs กรณี E2) รายงานว่ายังไม่ได้ตั้ง
 */
const securityHeaders = [
  // กันไม่ให้เว็บอื่นฝังหน้าเราใน iframe เพื่อหลอกให้ผู้ใช้กดโดยไม่รู้ตัว (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // กันเบราว์เซอร์เดาชนิดไฟล์เอง ซึ่งทำให้ไฟล์อัปโหลดถูกรันเป็นสคริปต์ได้
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // ไม่ส่ง URL เต็มของหน้าเราไปให้เว็บปลายทางเมื่อผู้ใช้กดลิงก์ออก
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // บังคับ HTTPS ไว้ล่วงหน้าหนึ่งปี
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // ปิดสิทธิ์อุปกรณ์ที่ระบบไม่ได้ใช้เลย
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
