'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminShell } from '@/components/admin-shell'
import { CefrBadge, EmptyState, Spinner } from '@/components/ui'
import { IconClock, IconPlus, IconVideo } from '@/components/icons'
import { CEFR_LEVELS } from '@/lib/cefr'
import { formatTHB } from '@/lib/enrollment-status'

interface CourseVideo {
  id: string
  title: string
  duration: number
}

interface Course {
  id: string
  title: string
  description: string
  minCefrLevel: string
  maxCefrLevel?: string
  duration: number
  price: number
  videos: CourseVideo[]
}

interface Video {
  id: string
  title: string
  duration: number
  adminLevel?: string
  suggestedLevel?: string
  courseId?: string | null
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minCefrLevel: 'B1',
    maxCefrLevel: '',
    instructorName: '',
    duration: '',
    price: '',
  })
  const [creating, setCreating] = useState(false)
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({})
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
    fetchVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/admin/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    }
  }

  const toggleVideo = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    )
  }

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
          price: parseInt(formData.price) || 0,
          learningOutcomes: [],
          videoIds: selectedVideoIds,
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
          price: '',
        })
        setSelectedVideoIds([])
        setShowCreateForm(false)
        await fetchCourses()
        await fetchVideos()
      }
    } catch (error) {
      console.error('Create failed:', error)
    } finally {
      setCreating(false)
    }
  }

  const savePrice = async (courseId: string) => {
    const raw = priceDraft[courseId]
    if (raw === undefined) return

    setSavingPriceId(courseId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Math.max(0, parseInt(raw) || 0) }),
      })
      if (response.ok) {
        await fetchCourses()
        setPriceDraft((prev) => {
          const next = { ...prev }
          delete next[courseId]
          return next
        })
      }
    } catch (error) {
      console.error('Failed to update price:', error)
    } finally {
      setSavingPriceId(null)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('ยืนยันการลบคอร์สนี้ออกจากระบบ?')) return

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
    <AdminShell
      title="คอร์สเรียน"
      description="กำหนดโครงสร้างคอร์ส ช่วงระดับ CEFR และวิดีโอที่อยู่ในแต่ละคอร์ส"
      actions={
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="btn btn-primary btn-sm"
        >
          {showCreateForm ? (
            'ปิดแบบฟอร์ม'
          ) : (
            <>
              <IconPlus className="h-4 w-4" />
              สร้างคอร์ส
            </>
          )}
        </button>
      }
    >
      {showCreateForm && (
        <section className="card mb-8 overflow-hidden">
          <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
            สร้างคอร์สใหม่
          </h2>
          <form onSubmit={handleCreate} className="space-y-5 p-6">
            <div>
              <label htmlFor="title" className="label">
                ชื่อคอร์ส
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="เช่น Business English 101"
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                คำอธิบาย
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="เนื้อหาโดยรวมและกลุ่มผู้เรียนเป้าหมาย"
                rows={3}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="minCefrLevel" className="label">
                  ระดับ CEFR ต่ำสุด
                </label>
                <select
                  id="minCefrLevel"
                  name="minCefrLevel"
                  value={formData.minCefrLevel}
                  onChange={handleInputChange}
                  className="input"
                >
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="maxCefrLevel" className="label">
                  ระดับ CEFR สูงสุด
                </label>
                <select
                  id="maxCefrLevel"
                  name="maxCefrLevel"
                  value={formData.maxCefrLevel}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">ไม่จำกัด</option>
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="instructorName" className="label">
                  ผู้สอน
                </label>
                <input
                  id="instructorName"
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="ชื่อผู้สอน"
                />
              </div>

              <div>
                <label htmlFor="duration" className="label">
                  ระยะเวลารวม (ชั่วโมง)
                </label>
                <input
                  id="duration"
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="price" className="label">
                ราคา (บาท)
              </label>
              <input
                id="price"
                type="number"
                name="price"
                min={0}
                value={formData.price}
                onChange={handleInputChange}
                className="input sm:max-w-xs"
                placeholder="0"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                ใส่ 0 หากเป็นคอร์สฟรี — ผู้เรียนจะเข้าเรียนได้ทันทีโดยไม่ต้องชำระเงิน
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label mb-0">วิดีโอที่รวมในคอร์ส</span>
                {selectedVideoIds.length > 0 && (
                  <span className="text-xs font-medium text-brand-800">
                    เลือกแล้ว {selectedVideoIds.length} คลิป
                  </span>
                )}
              </div>

              {videos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  ยังไม่มีวิดีโอในระบบ — อัปโหลดที่หน้า &quot;วิดีโอ&quot; ก่อน
                </p>
              ) : (
                <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                  {videos.map((video) => {
                    const level = video.adminLevel || video.suggestedLevel
                    const checked = selectedVideoIds.includes(video.id)
                    return (
                      <label
                        key={video.id}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          checked ? 'bg-brand-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVideo(video.id)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-600"
                        />
                        <span className="min-w-0 flex-1 truncate text-slate-800">
                          {video.title}
                        </span>
                        {level && <CefrBadge level={level} />}
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">
                          {Math.round(video.duration / 60)} นาที
                        </span>
                        {video.courseId && (
                          <span className="shrink-0 text-xs text-amber-700">
                            อยู่ในคอร์สอื่น
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 pt-5">
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                    กำลังสร้าง...
                  </>
                ) : (
                  'สร้างคอร์ส'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดคอร์ส...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="space-y-4">
          {courses.map((course) => (
            <article key={course.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {course.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CefrBadge level={course.minCefrLevel} />
                  {course.maxCefrLevel && (
                    <>
                      <span className="text-xs text-slate-400">–</span>
                      <CefrBadge level={course.maxCefrLevel} />
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5" />
                  {course.duration} ชั่วโมง
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconVideo className="h-3.5 w-3.5" />
                  {course.videos.length} วิดีโอ
                </span>
                <span className="font-medium text-slate-700">
                  {course.price > 0 ? formatTHB(course.price) : 'เรียนฟรี'}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-5">
                <div>
                  <label
                    htmlFor={`price-${course.id}`}
                    className="label text-xs"
                  >
                    ปรับราคา (บาท)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`price-${course.id}`}
                      type="number"
                      min={0}
                      value={priceDraft[course.id] ?? String(course.price)}
                      onChange={(e) =>
                        setPriceDraft((prev) => ({
                          ...prev,
                          [course.id]: e.target.value,
                        }))
                      }
                      className="input w-32"
                    />
                    <button
                      onClick={() => savePrice(course.id)}
                      disabled={savingPriceId === course.id}
                      className="btn btn-secondary btn-sm"
                    >
                      {savingPriceId === course.id ? 'กำลังบันทึก...' : 'บันทึกราคา'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(course.id)}
                  className="btn btn-danger btn-sm"
                >
                  ลบคอร์ส
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีคอร์สในระบบ"
          description="สร้างคอร์สแรกเพื่อจัดกลุ่มวิดีโอและแนะนำผู้เรียนตามระดับ CEFR"
          action={
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              สร้างคอร์สแรก
            </button>
          }
        />
      )}
    </AdminShell>
  )
}
