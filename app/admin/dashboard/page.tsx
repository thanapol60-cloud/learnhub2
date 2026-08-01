'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    videosCount: 0,
    coursesCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
        } else {
          const data = await response.json()
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/')
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">วิดีโอทั้งหมด</p>
            <p className="text-4xl font-bold text-blue-600">{stats.videosCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">คอร์สทั้งหมด</p>
            <p className="text-4xl font-bold text-green-600">{stats.coursesCount}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin/videos"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">วิดีโอ</h3>
            <p className="text-gray-600 mb-4">อัพโหลดและจัดการวิดีโอเรียน</p>
            <span className="text-blue-600 font-medium">ไปยังหน้า →</span>
          </Link>

          <Link
            href="/admin/courses"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">คอร์ส</h3>
            <p className="text-gray-600 mb-4">สร้างและจัดการคอร์สเรียน</p>
            <span className="text-blue-600 font-medium">ไปยังหน้า →</span>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">สถิติ</h3>
            <p className="text-gray-600 mb-4">ดูสถิติการเรียนของผู้เรียน</p>
            <span className="text-blue-600 font-medium">ไปยังหน้า →</span>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มเติม</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ สามารถอัพโหลดวิดีโอ และ AI จะวิเคราะห์ระดับอัตโนมัติ</li>
            <li>✓ สามารถสร้างคอร์สจากวิดีโอและเลือกระดับ CEFR</li>
            <li>✓ ดูสถิติผู้เรียนและความก้าวหน้า</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
