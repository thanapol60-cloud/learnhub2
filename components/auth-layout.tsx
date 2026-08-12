import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import { IconCheck } from './icons'

const POINTS = [
  'ข้อสอบปรับระดับตามคำตอบของคุณแบบเรียลไทม์',
  'รายงานผลอ้างอิงกรอบมาตรฐาน CEFR ระดับ A1 – C2',
  'บันทึกประวัติการประเมินและติดตามความก้าวหน้า',
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="hero-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-brand-700/25 blur-3xl"
          aria-hidden="true"
        />

        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark tone="light" />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">
              LearnHub
            </span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-white/60">
              English Proficiency Assessment
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-snug tracking-tight text-white">
            ประเมินระดับภาษาอังกฤษ
            <br />
            ด้วยเกณฑ์ที่ตรวจสอบได้
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-white/75">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">
          © {new Date().getFullYear()} LearnHub · Common European Framework of Reference
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              LearnHub
            </span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
            {footer}
          </div>
        </div>
      </main>
    </div>
  )
}
