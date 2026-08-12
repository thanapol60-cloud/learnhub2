'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CEFR_DESCRIPTIONS, CEFR_LEVELS, CEFRLevel } from '@/lib/cefr'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EmptyState, LoadingScreen, PageHeader, StatCard } from '@/components/ui'
import { IconArrowRight, IconChart, IconTarget } from '@/components/icons'

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const result = await response.json()
          setData(result)
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
