'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth-layout'
import { Spinner } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      router.push(formData.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="สมัครใช้งาน"
      subtitle="สร้างบัญชีเพื่อเริ่มประเมินระดับและบันทึกความก้าวหน้า"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-medium text-brand-800 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      {error && (
        <div className="notice notice-error mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="label">
            ชื่อ-นามสกุล
          </label>
          <input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
            placeholder="ชื่อของคุณ"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
            placeholder="email@example.com"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="••••••••"
            />
            <p className="mt-1.5 text-xs text-slate-500">อย่างน้อย 6 ตัวอักษร</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              ยืนยันรหัสผ่าน
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="label">
            ประเภทบัญชี
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input"
          >
            <option value="user">ผู้เรียน — ทำแบบประเมินและเรียนคอร์ส</option>
            <option value="admin">ผู้ดูแลระบบ — จัดการเนื้อหาและดูสถิติ</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? (
            <>
              <Spinner className="h-4 w-4 border-white/30 border-t-white" />
              กำลังสร้างบัญชี...
            </>
          ) : (
            'สร้างบัญชี'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
