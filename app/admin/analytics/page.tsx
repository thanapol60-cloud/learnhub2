'use client'

import { useState, useEffect } from 'react'
import { AdminShell } from '@/components/admin-shell'
import { EmptyState, Spinner, StatCard } from '@/components/ui'
import { IconBook, IconChart, IconLayers, IconUsers } from '@/components/icons'
import { CEFR_LEVELS } from '@/lib/cefr'

interface LearnerStats {
  totalUsers: number
  averageLevel: string
  assessmentsCompleted: number
  courseEnrollments: number
  levelDistribution: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<LearnerStats | null>(null)
  const [loading, setLoading] = useState(true)

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

  const total = stats
    ? Object.values(stats.levelDistribution).reduce((a, b) => a + b, 0)
    : 0

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
              label="การประเมินที่เสร็จสิ้น"
              value={stats.assessmentsCompleted}
              icon={<IconChart className="h-5 w-5" />}
            />
            <StatCard
              label="การลงทะเบียนคอร์ส"
              value={stats.courseEnrollments}
              icon={<IconBook className="h-5 w-5" />}
            />
            <StatCard
              label="ระดับเฉลี่ย"
              value={stats.averageLevel}
              icon={<IconLayers className="h-5 w-5" />}
            />
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                การกระจายตัวของระดับ CEFR
              </h2>
              <span className="text-xs text-slate-500">
                ฐานข้อมูล {total} ผู้เรียน
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {CEFR_LEVELS.map((level) => {
                const count = stats.levelDistribution[level] ?? 0
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

          <section className="grid gap-5 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                ข้อสังเกตจากข้อมูล
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li>• ระดับที่พบมากที่สุดสะท้อนกลุ่มผู้เรียนหลักของแพลตฟอร์ม</li>
                <li>• จำนวนการประเมินเทียบกับผู้เรียนบอกอัตราการทำซ้ำ</li>
                <li>• การลงทะเบียนคอร์สบอกความต่อเนื่องหลังทราบผล</li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                สิ่งที่ควรดำเนินการต่อ
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li>• เพิ่มคอร์สสำหรับระดับที่ยังมีเนื้อหารองรับน้อย</li>
                <li>• เสริมวิดีโอในระดับที่มีผู้เรียนหนาแน่นที่สุด</li>
                <li>• ทบทวนคลังคำถามในระดับที่มีอัตราตอบผิดสูง</li>
              </ul>
            </div>
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
