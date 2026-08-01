'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CEFRLevel, CEFR_DESCRIPTIONS } from '@/lib/cefr'

interface CourseVideo {
  id: string
  title: string
  duration: number
}

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: CEFRLevel
  instructorName?: string
  duration: number
  learningOutcomes?: string[]
  videos?: CourseVideo[]
}

interface ResultData {
  cefrLevel: CEFRLevel
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  recommendations: Course[]
}

export default function ResultPage() {
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch('/api/assessment/result')
        if (response.ok) {
          const data = await response.json()
          setResult(data)
        }
      } catch (error) {
        console.error('Failed to fetch result:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>กำลังคำนวณผลประเมินของคุณ...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่สามารถโหลดผลประเมินของคุณ</p>
          <Link href="/" className="text-blue-600 hover:underline">
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
    )
  }

  const getCefrColor = (level: CEFRLevel) => {
    const colors: Record<CEFRLevel, string> = {
      A1: 'from-blue-400 to-blue-600',
      A2: 'from-cyan-400 to-blue-600',
      B1: 'from-green-400 to-cyan-600',
      B2: 'from-lime-400 to-green-600',
      C1: 'from-yellow-400 to-lime-600',
      C2: 'from-orange-400 to-red-600',
    }
    return colors[level] || 'from-blue-400 to-blue-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* CEFR Result */}
        <div
          className={`bg-gradient-to-r ${getCefrColor(
            result.cefrLevel
          )} rounded-lg shadow-lg p-12 text-white text-center mb-12`}
        >
          <h1 className="text-4xl font-bold mb-4">ผลประเมินของคุณ</h1>
          <p className="text-6xl font-bold mb-4">{result.cefrLevel}</p>
          <p className="text-xl mb-6">
            {CEFR_DESCRIPTIONS[result.cefrLevel]}
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">คำถามทั้งหมด</p>
              <p className="text-2xl font-bold">{result.totalQuestions}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">คำตอบถูก</p>
              <p className="text-2xl font-bold">{result.correctAnswers}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">ความแม่นยำ</p>
              <p className="text-2xl font-bold">{result.accuracy}%</p>
            </div>
          </div>
        </div>

        {/* Courses Recommendation */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            คอร์สเรียนที่เหมาะสมสำหรับคุณ
          </h2>

          {result.recommendations.length > 0 ? (
            <div className="space-y-6">
              {result.recommendations.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-600"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {course.title}
                      </h3>
                      {course.instructorName && (
                        <p className="text-sm text-gray-600">
                          สอนโดย: {course.instructorName}
                        </p>
                      )}
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {course.minCefrLevel}+
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{course.description}</p>

                  {course.learningOutcomes && (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-800 mb-2">
                        เนื้อหาที่จะเรียน:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {course.learningOutcomes.map((outcome, idx) => (
                          <li key={idx} className="text-gray-700 text-sm">
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.videos && course.videos.length > 0 && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-800 mb-2">
                        คลิปในคอร์ส ({course.videos.length} คลิป):
                      </p>
                      <ol className="space-y-1">
                        {course.videos.map((video, idx) => (
                          <li
                            key={video.id}
                            className="text-sm text-gray-700 flex justify-between gap-4"
                          >
                            <span>
                              {idx + 1}. {video.title}
                            </span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {Math.round(video.duration / 60)} นาที
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">
                      ⏱️ {course.duration} ชั่วโมง
                    </span>
                    <button className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-all">
                      สมัครเรียน
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800">
                ยังไม่มีคอร์สเรียนที่พอเหมาะสม กรุณากลับมาตรวจสอบในภายหลังครับ
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all text-center"
          >
            กลับไปหน้าแรก
          </Link>
          <button
            onClick={() => {
              // Reset assessment and start again
              window.location.href = '/'
            }}
            className="w-full bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-400 transition-all"
          >
            ทำการประเมินใหม่
          </button>
        </div>
      </div>
    </div>
  )
}
