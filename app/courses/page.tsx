'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CefrBadge, EmptyState, PageHeader, Spinner } from '@/components/ui'
import { IconCheck, IconClock, IconUser } from '@/components/icons'
import { CEFR_LEVELS } from '@/lib/cefr'
import { formatTHB } from '@/lib/enrollment-status'
import { topicLabel } from '@/lib/topics'

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: string
  instructorName?: string
  duration: number
  price: number
  learningOutcomes?: string[]
  topics?: string[] | null
  isFocused?: boolean
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string | null>(null)
  const [filterKind, setFilterKind] = useState<'all' | 'focused' | 'level'>('all')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const filteredCourses = courses.filter((course) => {
    if (filterLevel && course.minCefrLevel !== filterLevel) return false
    if (filterKind === 'focused' && !course.isFocused) return false
    if (filterKind === 'level' && course.isFocused) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="container-page py-10">
        <PageHeader
          eyebrow="หลักสูตร"
          title="คอร์สเรียนทั้งหมด"
          description="คอร์สทุกรายการระบุระดับ CEFR ขั้นต่ำที่แนะนำ เพื่อให้เลือกเรียนได้ตรงกับความสามารถปัจจุบัน"
          actions={
            <Link href="/" className="btn btn-secondary btn-sm">
              ประเมินระดับของฉัน
            </Link>
          }
        />

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            ประเภท
          </span>
          {[
            { key: 'all' as const, label: 'ทั้งหมด' },
            { key: 'focused' as const, label: 'เจาะหัวข้อ' },
            { key: 'level' as const, label: 'ประจำระดับ' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterKind(item.key)}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filterKind === item.key
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            กรองตามระดับ
          </span>
          <button
            onClick={() => setFilterLevel(null)}
            className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filterLevel === null
                ? 'border-brand-800 bg-brand-800 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            ทั้งหมด
          </button>
          {CEFR_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                filterLevel === level
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {level}
            </button>
          ))}
          {!loading && (
            <span className="ml-auto text-sm text-slate-500">
              {filteredCourses.length} คอร์ส
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <Spinner className="mx-auto h-8 w-8" />
            <p className="mt-4 text-sm text-slate-500">กำลังโหลดคอร์สเรียน...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="card card-hover flex flex-col p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold leading-snug text-slate-900">
                    <Link
                      href={`/courses/${course.id}`}
                      className="transition-colors hover:text-brand-800"
                    >
                      {course.title}
                    </Link>
                  </h2>
                  <CefrBadge level={course.minCefrLevel} suffix="+" />
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {course.description}
                </p>

                {/* หัวข้อที่คอร์สนี้สอน — ตัวเดียวกับที่ใช้จับคู่กับข้อที่ผู้เรียนตอบผิด */}
                {Array.isArray(course.topics) && course.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {course.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800"
                      >
                        {topicLabel(topic)}
                      </span>
                    ))}
                  </div>
                )}

                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <ul className="mt-5 space-y-2">
                    {course.learningOutcomes.slice(0, 3).map((outcome, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                    {course.learningOutcomes.length > 3 && (
                      <li className="pl-6 text-xs text-slate-500">
                        และอีก {course.learningOutcomes.length - 3} หัวข้อ
                      </li>
                    )}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
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

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {course.price > 0 ? formatTHB(course.price) : 'เรียนฟรี'}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      รายละเอียด
                    </Link>
                    <Link
                      href={`/enroll/${course.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      ลงทะเบียน
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="ไม่พบคอร์สสำหรับระดับที่เลือก"
              description="ลองเลือกดูระดับอื่น หรือดูคอร์สทั้งหมดที่เปิดสอนอยู่ในขณะนี้"
              action={
                <button
                  onClick={() => setFilterLevel(null)}
                  className="btn btn-primary"
                >
                  ดูคอร์สทั้งหมด
                </button>
              }
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
