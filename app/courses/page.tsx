'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: string
  instructorName?: string
  duration: number
  learningOutcomes?: string[]
}

const CEFR_COLORS: Record<string, string> = {
  A1: 'bg-blue-100 text-blue-800',
  A2: 'bg-cyan-100 text-cyan-800',
  B1: 'bg-green-100 text-green-800',
  B2: 'bg-lime-100 text-lime-800',
  C1: 'bg-yellow-100 text-yellow-800',
  C2: 'bg-red-100 text-red-800',
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const filteredCourses = filterLevel
    ? courses.filter((course) => course.minCefrLevel === filterLevel)
    : courses

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block"
          >
            ← กลับไปหน้าแรก
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">คอร์สเรียน</h1>
          <p className="text-gray-600">
            ค้นหาคอร์สเรียนที่เหมาะสมกับระดับภาษาอังกฤษของคุณ
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterLevel(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterLevel === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              ทั้งหมด
            </button>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterLevel === level
                    ? `${CEFR_COLORS[level]} font-bold`
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลดคอร์สเรียน...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">
                      {course.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                        CEFR_COLORS[course.minCefrLevel]
                      }`}
                    >
                      {course.minCefrLevel}+
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                  {course.instructorName && (
                    <p className="text-sm text-gray-500 mb-4">
                      สอนโดย: {course.instructorName}
                    </p>
                  )}

                  {course.learningOutcomes && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        เนื้อหา:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {course.learningOutcomes.slice(0, 3).map((outcome, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                        {course.learningOutcomes.length > 3 && (
                          <li className="text-gray-500">
                            +{course.learningOutcomes.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-gray-600 text-sm">
                      ⏱️ {course.duration} ชั่วโมง
                    </span>
                    <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-all">
                      สมัครเรียน
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
            <p className="text-blue-800 mb-4">ไม่พบคอร์สเรียนสำหรับระดับที่เลือก</p>
            <button
              onClick={() => setFilterLevel(null)}
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
            >
              ดูทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
