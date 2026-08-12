'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '@/components/admin-shell'
import { CefrBadge, EmptyState, Spinner, StatCard } from '@/components/ui'
import { IconCheck, IconClose, IconUsers } from '@/components/icons'
import { formatTHB, statusLabel, statusStyle } from '@/lib/enrollment-status'

interface Enrollment {
  id: string
  status: string
  amount: number
  paymentRef?: string | null
  paymentNote?: string | null
  paidAt?: string | null
  enrolledAt: string
  reviewedAt?: string | null
  course: { id: string; title: string; minCefrLevel: string; price: number }
}

interface Student {
  id: string
  name: string
  email: string
  currentLevel: string
  correctAnswers: number
  wrongAnswers: number
  createdAt: string
  enrolledCourses: Enrollment[]
}

interface Summary {
  totalStudents: number
  totalEnrollments: number
  pendingReview: number
  revenue: number
}

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending_review', label: 'รอตรวจสอบการชำระ' },
  { key: 'active', label: 'เรียนได้แล้ว' },
  { key: 'none', label: 'ยังไม่ลงคอร์ส' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const review = async (enrollmentId: string, action: 'approve' | 'reject') => {
    setBusyId(enrollmentId)
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (response.ok) await fetchStudents()
    } catch (error) {
      console.error('Failed to review enrollment:', error)
    } finally {
      setBusyId(null)
    }
  }

  const visible = students.filter((student) => {
    const matchesQuery =
      query.trim() === '' ||
      student.name.toLowerCase().includes(query.toLowerCase()) ||
      student.email.toLowerCase().includes(query.toLowerCase())

    if (!matchesQuery) return false

    if (filter === 'all') return true
    if (filter === 'none') return student.enrolledCourses.length === 0
    return student.enrolledCourses.some((e) => e.status === filter)
  })

  return (
    <AdminShell
      title="นักเรียนทั้งหมด"
      description="รายชื่อผู้เรียนในระบบ คอร์สที่ลงทะเบียน และสถานะการชำระเงินที่รอตรวจสอบ"
    >
      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดรายชื่อนักเรียน...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {summary && (
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="นักเรียนทั้งหมด"
                value={summary.totalStudents}
                icon={<IconUsers className="h-5 w-5" />}
              />
              <StatCard label="รายการลงทะเบียน" value={summary.totalEnrollments} />
              <StatCard
                label="รอตรวจสอบการชำระ"
                value={summary.pendingReview}
                hint={summary.pendingReview > 0 ? 'ต้องดำเนินการ' : 'ไม่มีค้าง'}
              />
              <StatCard
                label="ยอดที่อนุมัติแล้ว"
                value={formatTHB(summary.revenue)}
              />
            </section>
          )}

          <section className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input max-w-xs"
              placeholder="ค้นหาชื่อหรืออีเมล"
              aria-label="ค้นหานักเรียน"
            />
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    filter === item.key
                      ? 'border-brand-800 bg-brand-800 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-slate-500">
              {visible.length} คน
            </span>
          </section>

          {visible.length === 0 ? (
            <EmptyState
              title="ไม่พบนักเรียนตามเงื่อนไข"
              description="ลองล้างคำค้นหา หรือเลือกตัวกรองอื่น"
            />
          ) : (
            <div className="space-y-4">
              {visible.map((student) => (
                <article key={student.id} className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {student.email} · สมัครเมื่อ{' '}
                        {new Date(student.createdAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        ตอบถูก {student.correctAnswers} / ผิด {student.wrongAnswers}
                      </span>
                      <CefrBadge level={student.currentLevel} />
                    </div>
                  </div>

                  {student.enrolledCourses.length === 0 ? (
                    <p className="px-6 py-5 text-sm text-slate-500">
                      ยังไม่ได้ลงทะเบียนคอร์สใด
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {student.enrolledCourses.map((enrollment) => (
                        <li
                          key={enrollment.id}
                          className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {enrollment.course.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ระดับ {enrollment.course.minCefrLevel}+ ·{' '}
                              {enrollment.amount > 0
                                ? formatTHB(enrollment.amount)
                                : 'ฟรี'}
                              {enrollment.paymentRef && ` · ${enrollment.paymentRef}`}
                              {enrollment.paidAt &&
                                ` · แจ้งโอน ${new Date(
                                  enrollment.paidAt
                                ).toLocaleString('th-TH', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}`}
                            </p>
                            {enrollment.paymentNote && (
                              <p className="mt-1 text-xs italic text-slate-500">
                                “{enrollment.paymentNote}”
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(
                                enrollment.status
                              )}`}
                            >
                              {statusLabel(enrollment.status)}
                            </span>

                            {enrollment.status !== 'active' && (
                              <button
                                onClick={() => review(enrollment.id, 'approve')}
                                disabled={busyId === enrollment.id}
                                className="btn btn-primary btn-sm"
                              >
                                <IconCheck className="h-4 w-4" />
                                อนุมัติ
                              </button>
                            )}
                            {enrollment.status !== 'rejected' && (
                              <button
                                onClick={() => review(enrollment.id, 'reject')}
                                disabled={busyId === enrollment.id}
                                className="btn btn-danger btn-sm"
                              >
                                <IconClose className="h-4 w-4" />
                                ไม่อนุมัติ
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  )
}
