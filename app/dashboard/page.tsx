'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CEFR_DESCRIPTIONS, CEFRLevel } from '@/lib/cefr'

interface DashboardData {
  currentLevel: CEFRLevel
  totalAssessments: number
  bestScore: number
  recentAssessment?: {
    date: string
    accuracy: number
    level: string
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูลของคุณ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">แดชบอร์ด</h1>
          <p className="text-gray-600">ดูความก้าวหน้าการเรียนภาษาอังกฤษของคุณ</p>
        </div>

        {data ? (
          <div className="space-y-8">
            {/* Current Level Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
              <p className="text-sm opacity-90 mb-2">ระดับปัจจุบัน</p>
              <p className="text-5xl font-bold mb-4">{data.currentLevel}</p>
              <p className="text-lg">
                {CEFR_DESCRIPTIONS[data.currentLevel] || 'Unknown Level'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">จำนวนการประเมิน</p>
                <p className="text-4xl font-bold text-blue-600">{data.totalAssessments}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-2">คะแนนสูงสุด</p>
                <p className="text-4xl font-bold text-green-600">{data.bestScore}%</p>
              </div>
            </div>

            {/* Recent Assessment */}
            {data.recentAssessment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  การประเมินล่าสุด
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่:</span>
                    <span className="font-medium">
                      {new Date(data.recentAssessment.date).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ระดับ:</span>
                    <span className="font-medium">{data.recentAssessment.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ความแม่นยำ:</span>
                    <span className="font-medium">{data.recentAssessment.accuracy}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all text-center"
              >
                ทำการประเมินใหม่
              </Link>
              <Link
                href="/courses"
                className="block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all text-center"
              >
                ดูคอร์สเรียน
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-4">ไม่พบข้อมูลการประเมิน</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
            >
              เริ่มการประเมินครั้งแรก
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
