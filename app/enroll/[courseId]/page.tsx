'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CefrBadge, EmptyState, LoadingScreen, Spinner } from '@/components/ui'
import { IconCheck, IconClock, IconUser } from '@/components/icons'
import { formatTHB, statusLabel, statusStyle } from '@/lib/enrollment-status'

interface Enrollment {
  id: string
  status: string
  amount: number
  paymentRef?: string | null
  paymentNote?: string | null
  paidAt?: string | null
  course: {
    id: string
    title: string
    description: string
    minCefrLevel: string
    duration: number
    instructorName?: string | null
    price: number
  }
}

export default function EnrollPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [promptPay, setPromptPay] = useState({ promptPayId: '', promptPayName: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needLogin, setNeedLogin] = useState(false)
  const [note, setNote] = useState('')
  const [reporting, setReporting] = useState(false)

  const loadEnrollment = useCallback(async (enrollmentId: string) => {
    const res = await fetch(`/api/enrollments/${enrollmentId}`)
    if (!res.ok) return
    const data = await res.json()
    setEnrollment(data.enrollment)
    setPromptPay(data.payment)
  }, [])

  useEffect(() => {
    const start = async () => {
      try {
        const res = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })

        if (res.status === 401) {
          setNeedLogin(true)
          return
        }

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'ลงทะเบียนไม่สำเร็จ')
          return
        }

        await loadEnrollment(data.enrollment.id)
      } catch {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      } finally {
        setLoading(false)
      }
    }

    start()
  }, [courseId, loadEnrollment])

  const reportPayment = async () => {
    if (!enrollment) return
    setReporting(true)
    try {
      const res = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentNote: note }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'แจ้งชำระเงินไม่สำเร็จ')
        return
      }
      await loadEnrollment(enrollment.id)
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <LoadingScreen label="กำลังเตรียมรายการลงทะเบียน..." />
      </div>
    )
  }

  if (needLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="container-narrow py-16">
          <EmptyState
            title="กรุณาเข้าสู่ระบบก่อนลงทะเบียนเรียน"
            description="ระบบต้องผูกการชำระเงินกับบัญชีของคุณ เพื่อให้ผู้ดูแลตรวจสอบและเปิดสิทธิ์เรียนได้ถูกคน"
            action={
              <div className="flex gap-3">
                <Link href="/login" className="btn btn-primary">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="btn btn-secondary">
                  สมัครใช้งาน
                </Link>
              </div>
            }
          />
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="container-narrow py-16">
          <EmptyState
            title="ไม่สามารถเปิดรายการลงทะเบียนได้"
            description={error || 'กรุณาลองใหม่อีกครั้ง'}
            action={
              <button onClick={() => router.push('/courses')} className="btn btn-primary">
                กลับไปหน้าคอร์สเรียน
              </button>
            }
          />
        </div>
        <SiteFooter />
      </div>
    )
  }

  const { course, status } = enrollment
  const isActive = status === 'active'
  const isPendingReview = status === 'pending_review'
  const isRejected = status === 'rejected'

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="container-narrow py-10">
        <p className="eyebrow">การลงทะเบียนเรียน</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {course.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <CefrBadge level={course.minCefrLevel} suffix="+" />
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
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(
              status
            )}`}
          >
            {statusLabel(status)}
          </span>
        </div>

        {error && (
          <div className="notice notice-error mt-6" role="alert">
            {error}
          </div>
        )}

        {isActive ? (
          <section className="card mt-8 p-8 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <IconCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              เปิดสิทธิ์เรียนเรียบร้อยแล้ว
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              คุณเข้าเรียนคอร์ส &quot;{course.title}&quot; ได้ทันที
              ดูรายการคอร์สทั้งหมดของคุณได้ที่หน้าความก้าวหน้า
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/dashboard" className="btn btn-primary">
                ไปที่คอร์สของฉัน
              </Link>
              <Link href="/courses" className="btn btn-secondary">
                ดูคอร์สอื่น
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
            {/* QR */}
            <section className="card overflow-hidden">
              <p className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                สแกนเพื่อชำระเงิน
              </p>
              <div className="p-5">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/payment/qr?enrollmentId=${enrollment.id}`}
                    alt={`QR พร้อมเพย์สำหรับคอร์ส ${course.title}`}
                    className="mx-auto block h-auto w-full max-w-[280px]"
                  />
                </div>
                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">พร้อมเพย์</dt>
                    <dd className="font-medium tabular-nums text-slate-900">
                      {promptPay.promptPayId}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">ชื่อบัญชี</dt>
                    <dd className="font-medium text-slate-900">
                      {promptPay.promptPayName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5">
                    <dt className="text-slate-500">ยอดชำระ</dt>
                    <dd className="text-base font-semibold tabular-nums text-slate-900">
                      {formatTHB(enrollment.amount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">รหัสอ้างอิง</dt>
                    <dd className="font-mono text-sm font-semibold text-brand-800">
                      {enrollment.paymentRef}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* ขั้นตอน */}
            <section className="card overflow-hidden">
              <p className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
                ขั้นตอนการชำระเงิน
              </p>

              <ol className="divide-y divide-slate-100">
                {[
                  'เปิดแอปธนาคารแล้วสแกน QR ด้านซ้าย ยอดเงินจะถูกกรอกอัตโนมัติ',
                  'โอนเงินให้ตรงกับยอดที่ระบุ เพื่อให้ตรวจสอบได้รวดเร็ว',
                  'กลับมาที่หน้านี้แล้วกด "แจ้งชำระเงินแล้ว" พร้อมระบุเวลาที่โอน',
                  'ผู้ดูแลตรวจสอบและเปิดสิทธิ์เรียนให้ (ปกติภายใน 24 ชั่วโมง)',
                ].map((step, index) => (
                  <li key={index} className="flex gap-4 px-6 py-3.5 text-sm">
                    <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-300 text-xs font-semibold tabular-nums text-slate-600">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="border-t border-slate-200 p-6">
                {isPendingReview ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-900">
                    <strong className="font-semibold">
                      แจ้งชำระเงินเรียบร้อยแล้ว
                    </strong>
                    <p className="mt-1 leading-relaxed">
                      ระบบส่งรายการให้ผู้ดูแลตรวจสอบแล้ว
                      สถานะจะเปลี่ยนเป็น &quot;เรียนได้แล้ว&quot; เมื่อได้รับอนุมัติ
                      ติดตามได้ที่หน้าความก้าวหน้า
                    </p>
                    <Link href="/dashboard" className="btn btn-secondary btn-sm mt-4">
                      ไปที่คอร์สของฉัน
                    </Link>
                  </div>
                ) : (
                  <>
                    {isRejected && (
                      <div className="notice notice-error mb-5">
                        รายการก่อนหน้าไม่ได้รับอนุมัติ
                        กรุณาตรวจสอบยอดโอนแล้วแจ้งใหม่อีกครั้ง
                      </div>
                    )}
                    <label htmlFor="note" className="label">
                      รายละเอียดการโอน (ไม่บังคับ)
                    </label>
                    <input
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="input"
                      placeholder="เช่น โอนเวลา 14:30 ธนาคารกสิกร ลงท้าย 1234"
                    />
                    <button
                      onClick={reportPayment}
                      disabled={reporting}
                      className="btn btn-primary mt-4 w-full sm:w-auto"
                    >
                      {reporting ? (
                        <>
                          <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                          กำลังส่งข้อมูล...
                        </>
                      ) : (
                        'แจ้งชำระเงินแล้ว'
                      )}
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
