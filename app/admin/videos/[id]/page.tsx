'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface Video {
  id: string
  title: string
  description?: string
  suggestedLevel?: string
  adminLevel?: string
  courseId?: string
  analysisSummary?: string
}

interface Course {
  id: string
  title: string
  minCefrLevel: string
}

export default function EditVideoPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await fetch(`/api/admin/videos`)
        if (videoRes.ok) {
          const videoData = await videoRes.json()
          const foundVideo = videoData.videos.find(
            (v: Video) => v.id === videoId
          )
          if (foundVideo) {
            setVideo(foundVideo)
            setSelectedLevel(foundVideo.adminLevel || foundVideo.suggestedLevel || '')
            setSelectedCourse(foundVideo.courseId || '')
          }
        }

        const coursesRes = await fetch(`/api/admin/courses`)
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData.courses)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [videoId])

  const handleSave = async () => {
    if (!video || !selectedLevel) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminLevel: selectedLevel,
          courseId: selectedCourse || null,
        }),
      })

      if (response.ok) {
        alert('บันทึกสำเร็จ')
        router.push('/admin/videos')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('บันทึกล้มเหลว')
    } finally {
      setSaving(false)
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

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบวิดีโอ</p>
          <Link href="/admin/videos" className="text-blue-600 hover:underline">
            กลับไปหน้าวิดีโอ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/videos" className="text-blue-600 hover:text-blue-700">
            ← กลับ
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">แก้ไขวิดีโอ</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Video Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {video.title}
            </h2>
            <p className="text-gray-600">{video.description}</p>
          </div>

          {/* AI Suggestion */}
          {video.suggestedLevel && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="font-medium text-green-800 mb-2">
                ✓ Suggested by AI Analysis
              </p>
              <p className="text-3xl font-bold text-green-600">
                {video.suggestedLevel}
              </p>
              <p className="text-sm text-gray-700 mt-3">
                {video.analysisSummary}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-3">
                เลือกระดับ CEFR
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CEFR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`py-3 px-4 rounded-lg font-bold transition-all ${
                      selectedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                เพิ่มลงในคอร์ส (optional)
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- เลือกคอร์ส --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.minCefrLevel}+)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={saving || !selectedLevel}
              className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <Link
              href="/admin/videos"
              className="flex-1 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-400 text-center"
            >
              ยกเลิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
