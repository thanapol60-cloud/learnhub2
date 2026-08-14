'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CEFRLevel, CEFR_DESCRIPTIONS, CEFR_LEVELS } from '@/lib/cefr'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CefrBadge, EmptyState, LoadingScreen } from '@/components/ui'
import { IconArrowRight, IconCheck, IconClock, IconUser } from '@/components/icons'
import { formatTHB } from '@/lib/enrollment-status'
import { topicLabel } from '@/lib/topics'

interface CourseVideo {
  id: string
  title: string
  duration: number
}

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: CEFRLevel
  instructorName?: string
  duration: number
  price: number
  learningOutcomes?: string[]
  videos?: CourseVideo[]
}

interface ResultData {
  cefrLevel: CEFRLevel
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  recommendations: Course[]
}

interface WeakTopic {
  topic: string
  attempted: number
  wrong: number
  accuracy: number
}

interface FocusedCourse {
  id: string
  title: string
  description: string
  minCefrLevel: string
  duration: number
  price: number
  isFocused: boolean
  videoCount: number
  matchedTopics: string[]
}

export default function ResultPage() {
  const [result, setResult] = useState<ResultData | null>(null)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [targeted, setTargeted] = useState<FocusedCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const [resultRes, recRes] = await Promise.all([
          fetch('/api/assessment/result'),
          fetch('/api/recommendations'),
        ])
        if (resultRes.ok) setResult(await resultRes.json())
        if (recRes.ok) {
          const data = await recRes.json()
          setWeakTopics(data.weakTopics ?? [])
          setTargeted(data.courses ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch result:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <LoadingScreen label="กำลังประมวลผลการประเมินของคุณ..." />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="container-narrow py-16">
          <EmptyState
            title="ไม่พบผลการประเมิน"
            description="ยังไม่มีข้อมูลการประเมินในเซสชันนี้ กรุณาเริ่มทำแบบประเมินใหม่อีกครั้ง"
            action={
              <Link href="/" className="btn btn-primary">
                กลับหน้าแรก
              </Link>
            }
          />
        </div>
        <SiteFooter />
      </div>
    )
  }

  const levelIndex = CEFR_LEVELS.indexOf(result.cefrLevel)

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Report summary */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12">
          <p className="eyebrow">รายงานผลการประเมิน</p>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <div className="flex items-end gap-5">
                <span className="text-6xl font-semibold tracking-tight text-slate-900">
                  {result.cefrLevel}
                </span>
                <div className="pb-2">
                  <p className="text-base font-medium text-slate-900">
                    {CEFR_DESCRIPTIONS[result.cefrLevel]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    อ้างอิงกรอบมาตรฐาน CEFR
                  </p>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                <div className="px-5 py-4">
                  <dt className="text-xs text-slate-500">ข้อทั้งหมด</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                    {result.totalQuestions}
                  </dd>
                </div>
                <div className="px-5 py-4">
                  <dt className="text-xs text-slate-500">ตอบถูก</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                    {result.correctAnswers}
                  </dd>
                </div>
                <div className="px-5 py-4">
                  <dt className="text-xs text-slate-500">ความแม่นยำ</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                    {result.accuracy}%
                  </dd>
                </div>
              </dl>
            </div>

            {/* Position on the CEFR scale */}
            <div className="card p-6">
              <p className="rule-label mb-5">ตำแหน่งบนกรอบระดับ CEFR</p>
              <div className="flex items-end gap-2">
                {CEFR_LEVELS.map((level, index) => {
                  const reached = index <= levelIndex
                  return (
                    <div key={level} className="flex flex-1 flex-col items-center gap-2">
                      <span
                        className={`w-full rounded-t-sm transition-all ${
                          index === levelIndex
                            ? 'bg-brand-800'
                            : reached
                            ? 'bg-brand-300'
                            : 'bg-slate-100'
                        }`}
                        style={{ height: `${28 + index * 16}px` }}
                      />
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          index === levelIndex ? 'text-brand-900' : 'text-slate-400'
                        }`}
                      >
                        {level}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
                ระดับนี้คำนวณจากความแม่นยำรวมและความยากของข้อที่ทำได้
                ทำแบบประเมินซ้ำเพื่อยืนยันผลได้ตลอดเวลา
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* จุดที่ตอบผิด + คอร์สที่ตรงจุดนั้น */}
      {weakTopics.length > 0 && (
        <section className="container-page pt-14">
          <p className="eyebrow">วิเคราะห์รายหัวข้อ</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            จุดที่ควรซ่อมก่อน
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            มาจากข้อที่คุณตอบผิดจริงในการประเมินครั้งนี้ ไม่ใช่การเดาจากระดับรวม
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weakTopics.slice(0, 6).map((item) => (
              <div key={item.topic} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {topicLabel(item.topic)}
                  </p>
                  <span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                    ผิด {item.wrong}/{item.attempted}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${100 - item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {targeted.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900">
                คอร์สที่ตรงกับจุดเหล่านี้
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {targeted.map((course) => (
                  <article key={course.id} className="card card-hover flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold leading-snug text-slate-900">
                        <Link href={`/courses/${course.id}`} className="hover:text-brand-800">
                          {course.title}
                        </Link>
                      </h4>
                      <CefrBadge level={course.minCefrLevel} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {course.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.matchedTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800"
                        >
                          {topicLabel(topic)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-500">
                        {course.videoCount} บท · {course.duration} ชม.
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {course.price > 0 ? formatTHB(course.price) : 'ฟรี'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recommendations */}
      <section className="container-page py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              คอร์สเรียนที่แนะนำสำหรับระดับของคุณ
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              คัดเลือกจากคอร์สที่กำหนดระดับขั้นต่ำไม่เกินระดับที่คุณประเมินได้
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline"
          >
            ดูคอร์สทั้งหมด
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {result.recommendations.length > 0 ? (
          <div className="mt-8 space-y-4">
            {result.recommendations.map((course) => (
              <article key={course.id} className="card card-hover p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      <Link
                        href={`/courses/${course.id}`}
                        className="transition-colors hover:text-brand-800"
                      >
                        {course.title}
                      </Link>
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {course.instructorName && (
                        <span className="inline-flex items-center gap-1.5">
                          <IconUser className="h-3.5 w-3.5" />
                          {course.instructorName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <IconClock className="h-3.5 w-3.5" />
                        {course.duration} ชั่วโมง
                      </span>
                    </div>
                  </div>
                  <CefrBadge level={course.minCefrLevel} suffix="+" />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {course.description}
                </p>

                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className="mt-5">
                    <p className="rule-label mb-3">สิ่งที่จะได้เรียนรู้</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {course.learningOutcomes.map((outcome, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.videos && course.videos.length > 0 && (
                  <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                    <p className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      บทเรียนในคอร์ส ({course.videos.length} คลิป)
                    </p>
                    <ol className="divide-y divide-slate-100">
                      {course.videos.map((video, idx) => (
                        <li
                          key={video.id}
                          className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">
                              {idx + 1}
                            </span>
                            <span className="truncate text-slate-700">
                              {video.title}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-500">
                            {Math.round(video.duration / 60)} นาที
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {course.price > 0 ? formatTHB(course.price) : 'เรียนฟรี'}
                  </span>
                  <Link
                    href={`/enroll/${course.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    ลงทะเบียนเรียน
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="ยังไม่มีคอร์สที่ตรงกับระดับนี้"
              description="ทีมงานกำลังเพิ่มคอร์สสำหรับระดับของคุณ ระหว่างนี้สามารถดูคอร์สทั้งหมดที่เปิดสอนได้"
              action={
                <Link href="/courses" className="btn btn-secondary">
                  ดูคอร์สทั้งหมด
                </Link>
              }
            />
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
          <Link href="/dashboard" className="btn btn-primary">
            ไปยังความก้าวหน้าของฉัน
          </Link>
          <Link href="/" className="btn btn-secondary">
            ทำแบบประเมินอีกครั้ง
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
