/** สถานะการลงทะเบียน — ใช้ร่วมกันทั้งฝั่งเซิร์ฟเวอร์และหน้าเว็บ (ไม่มี dependency ฝั่ง Node) */
export type EnrollmentStatus =
  | 'awaiting_payment'
  | 'pending_review'
  | 'active'
  | 'rejected'

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  awaiting_payment: 'รอชำระเงิน',
  pending_review: 'รอตรวจสอบการชำระ',
  active: 'เรียนได้แล้ว',
  rejected: 'ไม่อนุมัติ',
}

export const ENROLLMENT_STATUS_STYLE: Record<EnrollmentStatus, string> = {
  awaiting_payment: 'bg-slate-100 text-slate-700 ring-slate-200',
  pending_review: 'bg-amber-50 text-amber-800 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-50 text-red-800 ring-red-200',
}

export function statusLabel(status: string): string {
  return ENROLLMENT_STATUS_LABEL[status as EnrollmentStatus] ?? status
}

export function statusStyle(status: string): string {
  return (
    ENROLLMENT_STATUS_STYLE[status as EnrollmentStatus] ??
    'bg-slate-100 text-slate-700 ring-slate-200'
  )
}

export function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount)
}
