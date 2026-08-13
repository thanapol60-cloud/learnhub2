'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CEFR_DESCRIPTIONS, CEFR_LEVELS, CEFRLevel } from '@/lib/cefr'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EmptyState, LoadingScreen, PageHeader, StatCard } from '@/components/ui'
import { IconArrowRight, IconChart, IconTarget } from '@/components/icons'
import { formatTHB, statusLabel, statusStyle } from '@/lib/enrollment-status'

interface DashboardData {
  currentLevel: CEFRLevel
  totalAssessments: number
  bestScore: number
  recentAssessment?: {
    date: string
    accuracy: number
    level: string
  }
}

interface Enrollment {
  id: string
  status: string
  amount: number
  progress: number
  paymentRef?: string | null
  enrolledAt: string
  course: {
    id: string
    title: string
    minCefrLevel: string
    duration: number
    instructorName?: string | null
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardRes, enrollmentRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/enrollments'),
        ])

        if (dashboardRes.ok) {
          setData(await dashboardRes.json())
        }
        if (enrollmentRes.ok) {
          const result = await enrollmentRes.json()
          setEnrollments(result.enrollments ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <LoadingScreen label="กำลังโหลดข้อมูลของคุณ..." />
      </div>
    )
  }

  const levelIndex = data ? CEFR_LEVELS.indexOf(data.currentLevel) : -1

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="container-page py-10">
        <PageHeader
          eyebrow="ความก้าวหน้า"
          title="ภาพรวมของฉัน"
          description="สรุปผลการประเมินระดับภาษาอังกฤษและขั้นตอนถัดไปที่แนะนำ"
          actions={
            <Link href="/" className="btn btn-primary btn-sm">
              เริ่มการประเมินใหม่
            </Link>
          }
        />

        {data ? (
          <div className="mt-8 space-y-8">
            {/* Level panel */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-brand-950 text-white">
              <div className="hero-grid relative">
                <div className="relative grid gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                      ระดับปัจจุบัน
                    </p>
                    <p className="mt-2 text-5xl font-semibold tracking-tight text-white">
                      {data.currentLevel}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      {CEFR_DESCRIPTIONS[data.currentLevel] || 'ยังไม่ระบุระดับ'}
                    </p>
                  </div>

                  <div className="lg:border-l lg:border-white/10 lg:pl-8">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/55">
                      เส้นทางระดับ
                    </p>
                    <ol className="flex items-center gap-2">
                      {CEFR_LEVELS.map((level, index) => (
                        <li key={level} className="flex flex-1 flex-col gap-2">
                          <span
                            className={`h-1.5 rounded-full ${
                              index <= levelIndex ? 'bg-white' : 'bg-white/15'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              index === levelIndex ? 'text-white' : 'text-white/40'
                            }`}
                          >
                            {level}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid gap-5 sm:grid-cols-2">
              <StatCard
                label="จำนวนการประเมิน"
                value={data.totalAssessments}
                hint="ครั้งที่ทำแบบประเมินทั้งหมด"
                icon={<IconTarget className="h-5 w-5" />}
              />
              <StatCard
                label="คะแนนสูงสุด"
                value={`${data.bestScore}%`}
                hint="ความแม่นยำสูงสุดที่ทำได้"
                icon={<IconChart className="h-5 w-5" />}
              />
            </section>

            {/* Recent assessment */}
            {data.recentAssessment && (
              <section className="card overflow-hidden">
                <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
                  การประเมินล่าสุด
                </h2>
                <dl className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                    <dt className="text-slate-500">วันที่</dt>
                    <dd className="font-medium tabular-nums text-slate-900">
                      {new Date(data.recentAssessment.date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                    <dt className="text-slate-500">ระดับที่ประเมินได้</dt>
                    <dd className="font-medium text-slate-900">
                      {data.recentAssessment.level}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                    <dt className="text-slate-500">ความแม่นยำ</dt>
                    <dd className="font-medium tabular-nums text-slate-900">
                      {data.recentAssessment.accuracy}%
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {/* Enrolled courses */}
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">คอร์สของฉัน</h2>
                <Link
                  href="/courses"
                  className="text-sm font-medium text-brand-800 hover:underline"
                >
                  หาคอร์สเพิ่ม
                </Link>
              </div>

              {enrollments.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {enrollments.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          <Link
                            href={`/courses/${item.course.id}`}
                            className="transition-colors hover:text-brand-800"
                          >
                            {item.course.title}
                          </Link>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ระดับ {item.course.minCefrLevel}+ · {item.course.duration}{' '}
                          ชั่วโมง
                          {item.amount > 0 && ` · ${formatTHB(item.amount)}`}
                          {item.paymentRef && ` · อ้างอิง ${item.paymentRef}`}
                          {item.status === 'active' && ` · เรียนไปแล้ว ${item.progress}%`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                        {item.status === 'active' ? (
                          <Link
                            href={`/courses/${item.course.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            เข้าเรียน
                          </Link>
                        ) : (
                          <Link
                            href={`/enroll/${item.course.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            ชำระเงิน
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  ยังไม่ได้ลงทะเบียนคอร์สใด —{' '}
                  <Link href="/courses" className="font-medium text-brand-800 hover:underline">
                    ดูคอร์สที่เปิดสอน
                  </Link>
                </p>
              )}
            </section>

            {/* Next steps */}
            <section className="grid gap-5 sm:grid-cols-2">
              <Link href="/" className="card card-hover flex items-start gap-4 p-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                  <IconTarget />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    ประเมินระดับอีกครั้ง
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    ทบทวนระดับปัจจุบันของคุณด้วยชุดคำถามใหม่
                  </span>
                </span>
              </Link>

              <Link href="/courses" className="card card-hover flex items-start gap-4 p-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                  <IconArrowRight />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    เลือกคอร์สเรียน
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    ดูคอร์สที่เหมาะกับระดับ {data.currentLevel} ของคุณ
                  </span>
                </span>
              </Link>
            </section>
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="ยังไม่มีข้อมูลการประเมิน"
              description="เริ่มทำแบบประเมินครั้งแรกเพื่อดูระดับ CEFR และคอร์สเรียนที่แนะนำสำหรับคุณ"
              action={
                <Link href="/" className="btn btn-primary">
                  เริ่มการประเมินครั้งแรก
                </Link>
              }
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
