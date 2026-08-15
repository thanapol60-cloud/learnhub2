'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandMark } from './brand-mark'

interface SessionUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

const NAV = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/assessment', label: 'แบบประเมิน' },
  { href: '/courses', label: 'คอร์สเรียน' },
  { href: '/writing', label: 'ฝึกเขียน' },
  { href: '/dashboard', label: 'ความก้าวหน้า' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (active) setUser(data.user)
        }
      } catch {
        // ไม่ได้เข้าสู่ระบบ — แสดงเมนูสำหรับผู้เยี่ยมชม
      } finally {
        if (active) setChecked(true)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [pathname])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900">
              LearnHub
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.14em] text-slate-500 sm:block">
              Adaptive Proficiency Assessment
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'text-brand-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!checked ? (
            <span className="h-9 w-24 animate-pulse rounded-md bg-slate-100" />
          ) : user ? (
            <>
              <Link
                href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-900"
              >
                {user.role === 'admin' ? 'ระบบผู้ดูแล' : user.name}
              </Link>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                สมัครใช้งาน
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="เปิดเมนู"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-3 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  <Link
                    href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    onClick={() => setOpen(false)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    {user.role === 'admin' ? 'ระบบผู้ดูแล' : 'บัญชีของฉัน'}
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false)
                      logout()
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    สมัครใช้งาน
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
