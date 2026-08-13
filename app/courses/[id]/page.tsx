'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackLink, CefrBadge, EmptyState, LoadingScreen } from '@/components/ui'
import { IconCheck, IconClock, IconUser, IconVideo } from '@/components/icons'
import { formatTHB, statusLabel, statusStyle } from '@/lib/enrollment-status'

interface Lesson {
  id: string
  title: string
  description?: string | null
  duration: number
  level?: string | null
  videoUrl: string | null
}

interface CourseDetail {
  id: string
  title: string
  description: string
  minCefrLevel: string
  instructorName?: string | null
  duration: number
  price: number
  learningOutcomes?: string[] | null
  lessons: Lesson[]
}

interface Enrollment {
  id: string
  status: string
  progress: number
  amount: number
  paymentRef?: string | null
}

function minutes(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} นาที`
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [done, setDone] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`)
        if (res.ok) {
          const data = await res.json()
          setCourse(data.course)
          setEnrollment(data.enrollment)
          setUnlocked(data.unlocked)
          setSignedIn(data.signedIn)
        }
      } catch (error) {
        console.error('Failed to load course:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  // ความคืบหน้าเก็บที่ฝั่งเซิร์ฟเวอร์ เพื่อให้หน้าแดชบอร์ดเห็นตรงกัน
  const saveProgress = useCallback(
    async (completed: string[], total: number) => {
      if (!enrollment || !total) return
      const percent = Math.round((completed.length / total) * 100)
      try {
        await fetch(`/api/enrollments/${enrollment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: percent }),
        })
        setEnrollment((prev) => (prev ? { ...prev, progress: percent } : prev))
      } catch (error) {
        console.error('Failed to save progress:', error)
      }
    },
    [enrollment]
  )

  const markDone = (lessonId: string) => {
    if (!course || done.includes(lessonId)) return
    const next = [...done, lessonId]
    setDone(next)
    saveProgress(next, course.lessons.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <LoadingScreen label="กำลังโหลดคอร์ส..." />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="container-narrow py-16">
          <EmptyState
            title="ไม่พบคอร์สนี้"
            description="คอร์สอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
            action={
              <Link href="/courses" className="btn btn-primary">
                กลับไปหน้าคอร์สเรียน
              </Link>
            }
          />
        </div>
        <SiteFooter />
      </div>
    )
  }

  const lesson = course.lessons[current]
  const outcomes = Array.isArray(course.learningOutcomes) ? course.learningOutcomes : []
  const progress = course.lessons.length
    ? Math.round((done.length / course.lessons.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Course header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <BackLink href="/courses">คอร์สทั้งหมด</BackLink>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <CefrBadge level={course.minCefrLevel} suffix="+" />
                {enrollment && (
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(
                      enrollment.status
                    )}`}
                  >
                    {statusLabel(enrollment.status)}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {course.title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {course.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
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
                <span className="inline-flex items-center gap-1.5">
                  <IconVideo className="h-3.5 w-3.5" />
                  {course.lessons.length} บทเรียน
                </span>
              </div>
            </div>

            <div className="card w-full max-w-xs p-5">
              <p className="rule-label">ค่าเรียน</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {course.price > 0 ? formatTHB(course.price) : 'เรียนฟรี'}
              </p>

              {unlocked ? (
                <>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>ความคืบหน้า</span>
                      <span className="tabular-nums">{progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-800 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <IconCheck className="h-4 w-4" />
                    เปิดสิทธิ์เรียนแล้ว
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {enrollment
                      ? 'สิทธิ์เรียนจะเปิดหลังผู้ดูแลตรวจสอบการชำระเงิน'
                      : 'ลงทะเบียนเพื่อปลดล็อกวิดีโอทุกบทในคอร์สนี้'}
                  </p>
                  <Link
                    href={signedIn ? `/enroll/${course.id}` : '/login'}
                    className="btn btn-primary mt-4 w-full"
                  >
                    {enrollment ? 'ไปที่หน้าชำระเงิน' : signedIn ? 'ลงทะเบียนเรียน' : 'เข้าสู่ระบบเพื่อลงทะเบียน'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Player */}
        <section>
          {unlocked && lesson?.videoUrl ? (
            <div className="card overflow-hidden">
              <video
                key={lesson.id}
                // #t=0.1 ทำให้เบราว์เซอร์แสดงเฟรมจริงแทนจอดำก่อนกดเล่น
                src={`${lesson.videoUrl}#t=0.1`}
                controls
                playsInline
                preload="metadata"
                onEnded={() => markDone(lesson.id)}
                className="aspect-video w-full bg-black"
              />
              <div className="p-6">
                <p className="eyebrow">บทที่ {current + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {lesson.title}
                </h2>
                {lesson.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {lesson.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                  <button
                    onClick={() => markDone(lesson.id)}
                    disabled={done.includes(lesson.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {done.includes(lesson.id) ? (
                      <>
                        <IconCheck className="h-4 w-4" />
                        เรียนบทนี้แล้ว
                      </>
                    ) : (
                      'ทำเครื่องหมายว่าเรียนจบ'
                    )}
                  </button>
                  {current < course.lessons.length - 1 && (
                    <button
                      onClick={() => setCurrent(current + 1)}
                      className="btn btn-primary btn-sm"
                    >
                      บทถัดไป
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center px-6 py-16 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <IconVideo className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-base font-semibold text-slate-900">
                วิดีโอถูกล็อกอยู่
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                ดูรายชื่อบทเรียนทั้งหมดได้ก่อนตัดสินใจ
                เมื่อลงทะเบียนและชำระเงินเรียบร้อยแล้ว ทุกบทจะเล่นได้ทันที
              </p>
              <Link
                href={signedIn ? `/enroll/${course.id}` : '/login'}
                className="btn btn-primary mt-6"
              >
                {course.price > 0 ? `ลงทะเบียน · ${formatTHB(course.price)}` : 'ลงทะเบียนเรียนฟรี'}
              </Link>
            </div>
          )}

          {outcomes.length > 0 && (
            <div className="card mt-6 p-6">
              <h2 className="text-sm font-semibold text-slate-900">สิ่งที่จะได้เรียนรู้</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Lesson list */}
        <aside className="card overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">บทเรียนในคอร์ส</h2>
            <span className="text-xs text-slate-500">
              {course.lessons.length} บท
            </span>
          </div>
          <ol className="divide-y divide-slate-100">
            {course.lessons.map((item, index) => {
              const active = unlocked && index === current
              const finished = done.includes(item.id)
              return (
                <li key={item.id}>
                  <button
                    onClick={() => unlocked && setCurrent(index)}
                    disabled={!unlocked}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors ${
                      active ? 'bg-brand-50' : unlocked ? 'hover:bg-slate-50' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums ${
                        finished
                          ? 'border-emerald-500 bg-emerald-600 text-white'
                          : active
                          ? 'border-brand-700 bg-brand-800 text-white'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {finished ? '✓' : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {minutes(item.duration)}
                        {item.level ? ` · ระดับ ${item.level}` : ''}
                        {!unlocked ? ' · ล็อกอยู่' : ''}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>
      </main>

      <SiteFooter />
    </div>
  )
}
