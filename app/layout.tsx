import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Inter } from 'next/font/google'
import './globals.css'
import { ChatWidget } from '@/components/chat-widget'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plex-thai',
})

export const metadata: Metadata = {
  title: {
    default: 'LearnHub — วัดระดับภาษาอังกฤษ คณิตศาสตร์ และวิทยาศาสตร์',
    template: '%s · LearnHub',
  },
  description:
    'แพลตฟอร์มวัดระดับแบบปรับความยากอัตโนมัติ 3 วิชา ภาษาอังกฤษตามกรอบ CEFR คณิตศาสตร์และวิทยาศาสตร์ตามเกณฑ์ 6 ระดับ พร้อมแนะนำคอร์สที่ตรงกับจุดที่ควรซ่อม',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#101d33',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${plexThai.variable}`}
      style={{
        // Latin ตัวเลข/ศัพท์เทคนิคใช้ Inter, ภาษาไทยใช้ IBM Plex Sans Thai
        ['--font-sans' as string]: `var(--font-inter), var(--font-plex-thai)`,
      }}
    >
      <body>
        {children}
        {/* ผู้ช่วยตอบคำถาม ซ่อนตัวเองในคอนโซลผู้ดูแลและหน้าทำข้อสอบ */}
        <ChatWidget />
      </body>
    </html>
  )
}
