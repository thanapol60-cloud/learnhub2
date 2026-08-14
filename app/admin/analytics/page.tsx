'use client'

import { useState, useEffect } from 'react'
import { AdminShell } from '@/components/admin-shell'
import { EmptyState, Spinner, StatCard } from '@/components/ui'
import { IconBook, IconChart, IconLayers, IconUsers } from '@/components/icons'
import { CefrDonut } from '@/components/cefr-donut'
import { SubjectKey } from '@/lib/subjects'

interface SubjectStats {
  subject: SubjectKey
  name: string
  framework: string
  levels: string[]
  levelDistribution: Record<string, number>
  assessed: number
  averageLevel: string
}

interface Learner {
  id: string
  name: string
  email: string
  answered: number
  correctAnswers: number
  accuracy: number
  enrollments: number
}

interface LearnerStats {
  totalUsers: number
  averageLevel: string
  assessmentsCompleted: number
  courseEnrollments: number
  levelDistribution: Record<string, number>
  subjects?: SubjectStats[]
  enrollmentsBySubject?: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<LearnerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<SubjectKey>('english')
  const [pinnedLevel, setPinnedLevel] = useState<string | null>(null)
  const [learners, setLearners] = useState<Learner[]>([])
  const [loadingLearners, setLoadingLearners] = useState(false)
  const [insight, setInsight] = useState<{ observations: string[]; actions: string[] } | null>(null)
  const [insightState, setInsightState] = useState<'idle' | 'loading' | 'unavailable'>('idle')
  const [insightNote, setInsightNote] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/analytics')
        if (response.ok) {
          setStats(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // ข้อสังเกตจาก AI อ่านข้อมูลจริงของวิชาที่เลือก จึงต้องดึงใหม่ทุกครั้งที่สลับวิชา
  useEffect(() => {
    let cancelled = false
    setInsight(null)
    setInsightNote(null)
    setInsightState('loading')

    fetch(`/api/admin/analytics/insight?subject=${subject}`)
      .then((res) => (res.ok ? res.json() : { available: false, message: 'เรียกไม่สำเร็จ' }))
      .then((data) => {
        if (cancelled) return
        if (data.available) {
          setInsight(data.insight)
          setInsightState('idle')
        } else {
          setInsightState('unavailable')
          setInsightNote(
            data.reason === 'no-key'
              ? 'ยังไม่ได้ตั้งค่า OpenAI API key — ตั้งได้ที่แท็บตั้งค่า'
              : data.message || 'สรุปข้อมูลไม่สำเร็จ'
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInsightState('unavailable')
          setInsightNote('เชื่อมต่อไม่สำเร็จ')
        }
      })

    return () => {
      cancelled = true
    }
  }, [subject])

  // ดึงรายชื่อเฉพาะตอนที่แอดมินคลิกระดับ จึงไม่ต้องส่งผู้เรียนทั้งหมดมาพร้อมหน้า
  useEffect(() => {
    if (!pinnedLevel) {
      setLearners([])
      return
    }

    let cancelled = false
    setLoadingLearners(true)
    fetch(`/api/admin/analytics/learners?subject=${subject}&level=${pinnedLevel}`)
      .then((res) => (res.ok ? res.json() : { learners: [] }))
      .then((data) => {
        // กันผลของคำขอเก่ามาทับ ถ้าแอดมินคลิกสลับระดับเร็ว ๆ
        if (!cancelled) setLearners(data.learners ?? [])
      })
      .catch(() => {
        if (!cancelled) setLearners([])
      })
      .finally(() => {
        if (!cancelled) setLoadingLearners(false)
      })

    return () => {
      cancelled = true
    }
  }, [subject, pinnedLevel])

  const subjects = stats?.subjects ?? []
  const active = subjects.find((s) => s.subject === subject) ?? subjects[0]
  const distribution = active?.levelDistribution ?? stats?.levelDistribution ?? {}
  const levels = active?.levels ?? []
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <AdminShell
      title="สถิติผู้เรียน"
      description="ภาพรวมการใช้งานและการกระจายระดับความสามารถของผู้เรียนในระบบ"
    >
      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดสถิติ...</p>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="ผู้เรียนทั้งหมด"
              value={stats.totalUsers}
              icon={<IconUsers className="h-5 w-5" />}
            />
            <StatCard
              label={`ประเมินแล้ว (${active?.name ?? ''})`}
              value={active?.assessed ?? 0}
              icon={<IconChart className="h-5 w-5" />}
            />
            <StatCard
              label="การลงทะเบียนคอร์ส"
              value={stats.courseEnrollments}
              hint={
                stats.enrollmentsBySubject
                  ? `วิชานี้ ${stats.enrollmentsBySubject[subject] ?? 0} รายการ`
                  : undefined
              }
              icon={<IconBook className="h-5 w-5" />}
            />
            <StatCard
              label={`ระดับเฉลี่ย (${active?.name ?? ''})`}
              value={active?.assessed ? active.averageLevel : '—'}
              icon={<IconLayers className="h-5 w-5" />}
            />
          </section>

          {/* เลือกวิชาที่จะดูสถิติ */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              วิชา
            </span>
            {subjects.map((item) => (
              <button
                key={item.subject}
                onClick={() => {
                  setSubject(item.subject)
                  setPinnedLevel(null)
                }}
                className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  subject === item.subject
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {item.name}
                <span className="ml-2 text-xs opacity-70">{item.assessed}</span>
              </button>
            ))}
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  สัดส่วนผู้เรียนตามระดับ — {active?.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{active?.framework}</p>
              </div>
              <span className="text-xs text-slate-500">
                คลิกที่ชิ้นส่วนเพื่อดูรายชื่อผู้เรียนในระดับนั้น
              </span>
            </div>
            <div className="p-6">
              {total > 0 ? (
                <CefrDonut
                  distribution={distribution}
                  levels={levels}
                  onPin={setPinnedLevel}
                />
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  ยังไม่มีผู้เรียนที่ประเมินวิชานี้
                </p>
              )}
            </div>

            {/* รายชื่อผู้เรียนของระดับที่คลิก */}
            {pinnedLevel && (
              <div className="border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between px-6 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    ผู้เรียนระดับ {pinnedLevel}
                    {!loadingLearners && (
                      <span className="ml-2 font-normal text-slate-500">
                        {learners.length} คน
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setPinnedLevel(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    ปิดรายชื่อ
                  </button>
                </div>

                {loadingLearners ? (
                  <div className="px-6 py-8 text-center">
                    <Spinner className="mx-auto h-5 w-5" />
                  </div>
                ) : learners.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-slate-500">
                    ไม่มีผู้เรียนในระดับนี้
                  </p>
                ) : (
                  <div className="max-h-96 overflow-y-auto border-t border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white text-left text-xs text-slate-500">
                        <tr className="border-b border-slate-200">
                          <th className="px-6 py-2.5 font-medium">ชื่อ</th>
                          <th className="px-4 py-2.5 font-medium">อีเมล</th>
                          <th className="px-4 py-2.5 text-right font-medium">ตอบถูก</th>
                          <th className="px-4 py-2.5 text-right font-medium">ความแม่นยำ</th>
                          <th className="px-6 py-2.5 text-right font-medium">คอร์ส</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {learners.map((learner) => (
                          <tr key={learner.id} className="hover:bg-slate-50">
                            <td className="px-6 py-2.5 font-medium text-slate-900">
                              {learner.name}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {learner.email}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                              {learner.correctAnswers}/{learner.answered}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                              {learner.accuracy}%
                            </td>
                            <td className="px-6 py-2.5 text-right tabular-nums text-slate-600">
                              {learner.enrollments}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                เปรียบเทียบรายระดับ
              </h2>
              <span className="text-xs text-slate-500">
                {active?.name} · ฐานข้อมูล {total} ผู้เรียน
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {levels.map((level) => {
                const count = distribution[level] ?? 0
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <div
                    key={level}
                    className="flex items-center gap-5 px-6 py-4 text-sm"
                  >
                    <span className="w-8 shrink-0 font-semibold tabular-nums text-slate-900">
                      {level}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-700 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </span>
                    <span className="w-32 shrink-0 text-right tabular-nums text-slate-600">
                      {count} คน ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ข้อสังเกตเหล่านี้สร้างจากข้อมูลจริงของวิชาที่เลือก ไม่ใช่ข้อความสำเร็จรูป */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                วิเคราะห์โดย AI จากข้อมูลจริง
              </h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {active?.name}
              </span>
            </div>

            {insightState === 'loading' ? (
              <div className="card p-6 text-center">
                <Spinner className="mx-auto h-5 w-5" />
                <p className="mt-3 text-sm text-slate-500">
                  กำลังให้ AI อ่านข้อมูลของวิชานี้...
                </p>
              </div>
            ) : insightState === 'unavailable' ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {insightNote}
              </div>
            ) : insight ? (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-slate-900">ข้อสังเกตจากข้อมูล</h3>
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                    {insight.observations.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-slate-900">สิ่งที่ควรดำเนินการต่อ</h3>
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                    {insight.actions.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีข้อมูลสถิติ"
          description="ข้อมูลจะปรากฏเมื่อมีผู้เรียนเริ่มทำแบบประเมินในระบบ"
        />
      )}
    </AdminShell>
  )
}
