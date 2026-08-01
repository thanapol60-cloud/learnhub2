'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleStartAssessment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        window.location.href = '/assessment'
      }
    } catch (error) {
      console.error('Failed to start assessment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Auth Header */}
      <header className="bg-white bg-opacity-10 backdrop-blur py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">LearnHub</h1>
          <div className="space-x-3">
            {user ? (
              <>
                <span className="text-white font-medium">
                  สวัสดี, {user.name}
                </span>
                <Link
                  href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="inline-block bg-white text-blue-600 font-bold py-2 px-4 rounded hover:bg-gray-100"
                >
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-block text-white font-bold py-2 px-4 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="inline-block bg-white text-blue-600 font-bold py-2 px-4 rounded hover:bg-gray-100"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-6">LearnHub</h1>
          <p className="text-xl mb-4">English Proficiency Assessment Platform</p>
          <p className="text-lg mb-12 opacity-90">
            ประเมินระดับภาษาอังกฤษของคุณด้วยการทดสอบแบบปรับระดับอัตโนมัติ
          </p>

          <div className="space-y-8">
            <button
              onClick={handleStartAssessment}
              disabled={isLoading}
              className="w-full bg-white text-blue-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? 'กำลังเตรียมการทดสอบ...' : 'เริ่มการประเมินระดับ'}
            </button>

            <Link
              href="/dashboard"
              className="block bg-purple-500 text-white font-bold py-4 px-8 rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105"
            >
              ดูผลการประเมินของฉัน
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-lg mb-2">Adaptive Testing</h3>
              <p className="text-sm opacity-90">
                ระดับความยากของข้อสอบปรับตัวตามความสามารถของคุณ
              </p>
            </div>

            <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-lg mb-2">CEFR Assessment</h3>
              <p className="text-sm opacity-90">
                ได้รับการประเมินมาตรฐาน CEFR ที่ยอมรับทั่วโลก
              </p>
            </div>

            <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-bold text-lg mb-2">Recommended Courses</h3>
              <p className="text-sm opacity-90">
                คอร์สเรียนที่เหมาะสมกับระดับของคุณ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
