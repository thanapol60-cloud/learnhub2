'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface LearnerStats {
  totalUsers: number
  averageLevel: string
  assessmentsCompleted: number
  courseEnrollments: number
  levelDistribution: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<LearnerStats | null>(null)
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

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

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
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
            ← กลับ
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">สถิติผู้เรียน</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {stats ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">ผู้เรียนทั้งหมด</p>
                <p className="text-4xl font-bold text-blue-600">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">การประเมินเสร็จแล้ว</p>
                <p className="text-4xl font-bold text-green-600">
                  {stats.assessmentsCompleted}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">การลงทะเบียนคอร์ส</p>
                <p className="text-4xl font-bold text-purple-600">
                  {stats.courseEnrollments}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">ระดับเฉลี่ย</p>
                <p className="text-4xl font-bold text-orange-600">
                  {stats.averageLevel}
                </p>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                การกระจายตัวของระดับ
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.levelDistribution)
                  .sort()
                  .map(([level, count]) => {
                    const total = Object.values(stats.levelDistribution).reduce(
                      (a, b) => a + b,
                      0
                    )
                    const percentage = total > 0 ? (count / total) * 100 : 0

                    return (
                      <div key={level}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-700">
                            {level}
                          </span>
                          <span className="text-gray-600">
                            {count} ผู้เรียน ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-800 mb-3">💡 Insights</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• อัพเดตความเข้าใจเกี่ยวกับระดับทั่วไปของผู้เรียน</li>
                  <li>• ติดตามการมีส่วนร่วมของผู้เรียนในคอร์ส</li>
                  <li>• ปรับปรุงเนื้อหาตามความต้องการของผู้เรียน</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-green-800 mb-3">✅ Next Steps</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• สร้างคอร์สสำหรับระดับที่มีผู้เรียนน้อยที่สุด</li>
                  <li>• เพิ่มวิดีโอเพื่อสนับสนุนระดับที่ได้รับความนิยมมากที่สุด</li>
                  <li>• ทำการสำรวจความพึงพอใจของผู้เรียน</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
            <p className="text-blue-800">ยังไม่มีข้อมูลสถิติ</p>
          </div>
        )}
      </div>
    </div>
  )
}
