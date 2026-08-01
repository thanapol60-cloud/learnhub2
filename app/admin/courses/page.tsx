'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: string
  maxCefrLevel?: string
  duration: number
  videos: any[]
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minCefrLevel: 'B1',
    maxCefrLevel: '',
    instructorName: '',
    duration: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
      } else if (response.status === 401 || response.status === 403) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration) || 0,
          learningOutcomes: [],
        }),
      })

      if (response.ok) {
        setFormData({
          title: '',
          description: '',
          minCefrLevel: 'B1',
          maxCefrLevel: '',
          instructorName: '',
          duration: '',
        })
        setShowCreateForm(false)
        await fetchCourses()
      }
    } catch (error) {
      console.error('Create failed:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบคอร์สนี้?')) return

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCourses()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
              ← กลับ
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">จัดการคอร์ส</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + สร้างคอร์สใหม่
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">สร้างคอร์สใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  ชื่อคอร์ส
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น Business English 101"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="รายละเอียดของคอร์ส"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    ระดับ CEFR ต่ำสุด
                  </label>
                  <select
                    name="minCefrLevel"
                    value={formData.minCefrLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CEFR_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    ระดับ CEFR สูงสุด
                  </label>
                  <select
                    name="maxCefrLevel"
                    value={formData.maxCefrLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- ไม่มีข้อจำกัด --</option>
                    {CEFR_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    ชื่อผู้สอน
                  </label>
                  <input
                    type="text"
                    name="instructorName"
                    value={formData.instructorName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    ระยะเวลา (ชั่วโมง)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'กำลังสร้าง...' : 'สร้าง'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลด...</p>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {course.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {course.minCefrLevel}
                      {course.maxCefrLevel && ` - ${course.maxCefrLevel}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">⏱️ {course.duration} ชั่วโมง</span>
                  </div>
                  <div>
                    <span className="text-gray-600">📹 {course.videos.length} วิดีโอ</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/courses/${course.id}`
                      )
                    }
                    className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
            <p className="text-blue-800 mb-4">ยังไม่มีคอร์ส</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            >
              สร้างคอร์สแรก
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
