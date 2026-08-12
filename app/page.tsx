'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CEFR_LEVELS, CEFR_DESCRIPTIONS } from '@/lib/cefr'
import { CefrBadge, Spinner } from '@/components/ui'
import {
  IconArrowRight,
  IconBook,
  IconChart,
  IconLayers,
  IconShield,
  IconTarget,
} from '@/components/icons'

const LEVEL_SUMMARY: Record<string, string> = {
  A1: 'สื่อสารประโยคพื้นฐานในชีวิตประจำวันได้',
  A2: 'เข้าใจบทสนทนาสั้นและเรื่องใกล้ตัวได้',
  B1: 'รับมือสถานการณ์ทั่วไปและเล่าเรื่องได้',
  B2: 'อภิปรายหัวข้อซับซ้อนได้อย่างคล่องตัว',
  C1: 'ใช้ภาษาเชิงวิชาการและวิชาชีพได้ยืดหยุ่น',
  C2: 'เข้าใจและใช้ภาษาได้ใกล้เคียงเจ้าของภาษา',
}

const PROCESS = [
  {
    step: '01',
    title: 'เริ่มจากระดับพื้นฐาน',
    body: 'ระบบเริ่มการประเมินที่ระดับ A1 เพื่อสร้างเส้นฐานของผู้เรียนทุกคนอย่างเท่าเทียม',
  },
  {
    step: '02',
    title: 'ปรับความยากตามคำตอบ',
    body: 'ตอบถูกต่อเนื่องระบบจะเลื่อนระดับขึ้น หากตอบผิดต่อเนื่องจะปรับลงเพื่อหาระดับที่แท้จริง',
  },
  {
    step: '03',
    title: 'สรุปผลและแนะนำคอร์ส',
    body: 'รายงานผลระบุระดับ CEFR ความแม่นยำ และคอร์สเรียนที่เหมาะสมกับระดับที่ประเมินได้',
  },
]

const FEATURES = [
  {
    icon: IconTarget,
    title: 'การประเมินแบบปรับระดับ',
    body: 'ความยากของข้อสอบเปลี่ยนตามผลตอบรายข้อ ทำให้ได้ระดับที่แม่นยำโดยใช้ข้อสอบน้อยกว่าแบบทดสอบคงที่',
  },
  {
    icon: IconShield,
    title: 'อ้างอิงมาตรฐาน CEFR',
    body: 'ผลประเมินเทียบกับกรอบมาตรฐาน A1–C2 ที่สถาบันการศึกษาและองค์กรทั่วโลกยอมรับ',
  },
  {
    icon: IconBook,
    title: 'เส้นทางเรียนต่อที่ชัดเจน',
    body: 'ทุกผลประเมินเชื่อมกับคอร์สและวิดีโอที่จัดระดับไว้แล้ว จึงต่อยอดการเรียนได้ทันที',
  },
]

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  const handleStartAssessment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        window.location.href = '/assessment'
      }
    } catch (error) {
      console.error('Failed to start assessment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="hero-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-700/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <IconLayers className="h-3.5 w-3.5" />
              CEFR-aligned assessment
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl">
              วัดระดับภาษาอังกฤษของคุณ
              <br className="hidden sm:block" /> ด้วยเกณฑ์มาตรฐานสากล
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70">
              LearnHub ประเมินความสามารถทางภาษาอังกฤษด้วยข้อสอบที่ปรับระดับตามคำตอบของคุณ
              รายงานผลอ้างอิงกรอบ CEFR ระดับ A1 ถึง C2
              พร้อมแนะนำคอร์สเรียนที่ตรงกับระดับที่ประเมินได้
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleStartAssessment}
                disabled={isLoading}
                className="btn btn-lg btn-inverse"
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-4 w-4 border-slate-300 border-t-brand-800" />
                    กำลังเตรียมข้อสอบ...
                  </>
                ) : (
                  <>
                    เริ่มการประเมิน
                    <IconArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <Link href="/courses" className="btn btn-lg btn-outline-light">
                ดูคอร์สเรียน
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { k: '15', v: 'ข้อต่อการประเมิน' },
                { k: '6', v: 'ระดับ A1 – C2' },
                { k: '~15', v: 'นาทีโดยเฉลี่ย' },
              ].map((item) => (
                <div key={item.v}>
                  <dt className="text-2xl font-semibold tabular-nums text-white">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-xs text-white/60">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Level ladder — แสดงโครงสร้างการประเมินให้เห็นเป็นรูปธรรม */}
          <div className="relative">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-sm font-semibold text-white">กรอบระดับ CEFR</p>
                <IconChart className="h-5 w-5 text-white/40" />
              </div>
              <ul className="mt-4 space-y-1">
                {[...CEFR_LEVELS].reverse().map((level, index) => (
                  <li
                    key={level}
                    className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-white">
                      {level}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-white/70"
                        style={{ width: `${100 - index * 15}%` }}
                      />
                    </span>
                    <span className="hidden w-[46%] shrink-0 text-xs leading-snug text-white/55 sm:block">
                      {LEVEL_SUMMARY[level]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-b border-slate-200 bg-white py-20">
        <div className="container-page">
          <p className="eyebrow">กระบวนการประเมิน</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            สามขั้นตอน จากข้อแรกถึงรายงานผล
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-3">
            {PROCESS.map((item) => (
              <div key={item.step} className="bg-white p-7">
                <span className="text-sm font-semibold tabular-nums text-brand-700">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="container-page">
          <div className="grid gap-10 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-800 shadow-card">
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level reference table */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">เกณฑ์อ้างอิง</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                ระดับความสามารถทั้งหกระดับ
              </h2>
            </div>
            <p className="max-w-md text-sm text-slate-600">
              Common European Framework of Reference for Languages
              คือกรอบอธิบายความสามารถทางภาษาที่ใช้อ้างอิงทั่วโลก
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">ระดับ</th>
                  <th className="px-5 py-3 font-semibold">คำอธิบาย</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">
                    ความสามารถโดยสรุป
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {CEFR_LEVELS.map((level) => (
                  <tr key={level} className="bg-white">
                    <td className="px-5 py-4">
                      <CefrBadge level={level} />
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {CEFR_DESCRIPTIONS[level]}
                    </td>
                    <td className="hidden px-5 py-4 text-slate-600 sm:table-cell">
                      {LEVEL_SUMMARY[level]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              พร้อมทราบระดับที่แท้จริงของคุณแล้วหรือยัง
            </h2>
            <p className="mt-2 text-sm text-white/65">
              ใช้เวลาประมาณ 15 นาที และดูผลได้ทันทีเมื่อทำครบทุกข้อ
            </p>
          </div>
          <button
            onClick={handleStartAssessment}
            disabled={isLoading}
            className="btn btn-lg btn-inverse shrink-0"
          >
            {isLoading ? 'กำลังเตรียมข้อสอบ...' : 'เริ่มการประเมิน'}
            {!isLoading && <IconArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
