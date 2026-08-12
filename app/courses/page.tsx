'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CefrBadge, EmptyState, PageHeader, Spinner } from '@/components/ui'
import { IconCheck, IconClock, IconUser } from '@/components/icons'
import { CEFR_LEVELS } from '@/lib/cefr'

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: string
  instructorName?: string
  duration: number
  learningOutcomes?: string[]
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string | null>(null)

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

  const filteredCourses = filterLevel
    ? courses.filter((course) => course.minCefrLevel === filterLevel)
    : courses

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
                    {course.title}
                  </h2>
                  <CefrBadge level={course.minCefrLevel} suffix="+" />
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {course.description}
                </p>

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

                <div className="mt-4 flex justify-end">
                  <button className="btn btn-secondary btn-sm">
                    ลงทะเบียนเรียน
                  </button>
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
