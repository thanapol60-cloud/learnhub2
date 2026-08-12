'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminShell } from '@/components/admin-shell'
import { StatCard } from '@/components/ui'
import {
  IconArrowRight,
  IconBook,
  IconChart,
  IconSparkle,
  IconUsers,
  IconVideo,
} from '@/components/icons'
import { formatTHB } from '@/lib/enrollment-status'

const SECTIONS = [
  {
    href: '/admin/students',
    icon: IconUsers,
    title: 'นักเรียน',
    body: 'ดูรายชื่อผู้เรียนทุกคน คอร์สที่ลงทะเบียน และอนุมัติการชำระเงินที่รอตรวจสอบ',
  },
  {
    href: '/admin/videos',
    icon: IconVideo,
    title: 'คลังวิดีโอ',
    body: 'อัปโหลดคลิปบทเรียน ตรวจสอบระดับที่ AI วิเคราะห์ และปรับระดับด้วยตนเอง',
  },
  {
    href: '/admin/courses',
    icon: IconBook,
    title: 'คอร์สเรียน',
    body: 'สร้างคอร์ส กำหนดช่วงระดับ CEFR และจัดกลุ่มวิดีโอเข้าคอร์ส',
  },
  {
    href: '/admin/analytics',
    icon: IconChart,
    title: 'สถิติผู้เรียน',
    body: 'ติดตามจำนวนผู้เรียน การกระจายระดับ และการลงทะเบียนคอร์ส',
  },
]

export default function AdminDashboard() {
  const [videoCount, setVideoCount] = useState<number | null>(null)
  const [courseCount, setCourseCount] = useState<number | null>(null)
  const [learnerCount, setLearnerCount] = useState<number | null>(null)
  const [pendingReview, setPendingReview] = useState<number | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const safeJson = async (url: string) => {
        try {
          const res = await fetch(url)
          return res.ok ? await res.json() : null
        } catch {
          return null
        }
      }

      const [videos, courses, analytics, students] = await Promise.all([
        safeJson('/api/admin/videos'),
        safeJson('/api/admin/courses'),
        safeJson('/api/admin/analytics'),
        safeJson('/api/admin/students'),
      ])

      setVideoCount(videos?.videos?.length ?? 0)
      setCourseCount(courses?.courses?.length ?? 0)
      setLearnerCount(analytics?.totalUsers ?? 0)
      setPendingReview(students?.summary?.pendingReview ?? 0)
      setRevenue(students?.summary?.revenue ?? 0)
    }

    load()
  }, [])

  const show = (value: number | null) => (value === null ? '—' : value)

  return (
    <AdminShell
      title="ภาพรวมระบบ"
      description="จัดการเนื้อหาการเรียนและติดตามผลการใช้งานของผู้เรียนทั้งหมดในที่เดียว"
    >
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ผู้เรียนทั้งหมด"
          value={show(learnerCount)}
          icon={<IconUsers className="h-5 w-5" />}
        />
        <StatCard
          label="รอตรวจสอบการชำระ"
          value={show(pendingReview)}
          hint={pendingReview ? 'ต้องดำเนินการที่แท็บนักเรียน' : undefined}
        />
        <StatCard
          label="ยอดที่อนุมัติแล้ว"
          value={revenue === null ? '—' : formatTHB(revenue)}
        />
        <StatCard
          label="วิดีโอ / คอร์ส"
          value={`${show(videoCount)} / ${show(courseCount)}`}
          icon={<IconVideo className="h-5 w-5" />}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          การจัดการ
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ href, icon: Icon, title, body }) => (
            <Link key={href} href={href} className="card card-hover group p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                <Icon />
              </span>
              <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-800">
                เปิดหน้าจัดการ
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card mt-10 flex items-start gap-4 p-6">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <IconSparkle />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">
            การวิเคราะห์ระดับด้วย AI
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            เมื่ออัปโหลดวิดีโอ ระบบจะวิเคราะห์ชื่อเรื่องและคำอธิบายเพื่อเสนอระดับ CEFR
            พร้อมเหตุผลประกอบ ผู้ดูแลสามารถยืนยันหรือกำหนดระดับใหม่ได้เสมอ
            ระดับที่ผู้ดูแลกำหนดจะถูกใช้เป็นค่าหลักในการแนะนำคอร์ส
          </p>
        </div>
      </section>
    </AdminShell>
  )
}
