import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Inter } from 'next/font/google'
import './globals.css'

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
    default: 'LearnHub — การประเมินระดับภาษาอังกฤษตามมาตรฐาน CEFR',
    template: '%s · LearnHub',
  },
  description:
    'แพลตฟอร์มประเมินระดับภาษาอังกฤษแบบปรับระดับอัตโนมัติ ประเมินผลตามกรอบมาตรฐาน CEFR (A1–C2) พร้อมคำแนะนำคอร์สเรียนที่ตรงกับระดับของผู้เรียน',
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
      <body>{children}</body>
    </html>
  )
}
