import Link from 'next/link'
import type { ReactNode } from 'react'

/** Muted, print-like tints so six levels read as one family. */
export const CEFR_BADGE: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-700 ring-slate-200',
  A2: 'bg-sky-50 text-sky-800 ring-sky-200',
  B1: 'bg-teal-50 text-teal-800 ring-teal-200',
  B2: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  C1: 'bg-amber-50 text-amber-800 ring-amber-200',
  C2: 'bg-rose-50 text-rose-800 ring-rose-200',
}

export function CefrBadge({
  level,
  suffix = '',
  className = '',
}: {
  level: string
  suffix?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ${
        CEFR_BADGE[level] ?? CEFR_BADGE.A1
      } ${className}`}
    >
      {level}
      {suffix}
    </span>
  )
}

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="กำลังโหลด"
      className={`inline-block animate-spin rounded-full border-2 border-slate-200 border-t-brand-700 ${className}`}
    />
  )
}

export function LoadingScreen({ label = 'กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-4 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="rule-label">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="stat-value mt-3">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function BackLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-800"
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
