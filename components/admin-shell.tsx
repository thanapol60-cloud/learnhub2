'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import { LoadingScreen } from './ui'

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'ภาพรวม' },
  { href: '/admin/students', label: 'นักเรียน' },
  { href: '/admin/videos', label: 'วิดีโอ' },
  { href: '/admin/courses', label: 'คอร์ส' },
  { href: '/admin/analytics', label: 'สถิติ' },
  { href: '/admin/ai', label: 'ระบบ AI' },
  { href: '/admin/settings', label: 'ตั้งค่า' },
]

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
          return
        }
        const data = await response.json()
        if (data.user.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        setName(data.user.name)
        setAuthorized(true)
      } catch {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LoadingScreen label="กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-brand-900/40 bg-brand-950 text-white">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <BrandMark tone="light" className="h-8 w-8" />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight">
                LearnHub
              </span>
              <span className="block text-[11px] uppercase tracking-[0.14em] text-white/60">
                Console
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/70 sm:inline">{name}</span>
            <button onClick={logout} className="btn btn-outline-light btn-sm">
              ออกจากระบบ
            </button>
          </div>
        </div>

        <div className="container-page">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {ADMIN_NAV.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                    active
                      ? 'border-white text-white'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
