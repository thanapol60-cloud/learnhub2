'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AdminShell } from '@/components/admin-shell'
import { BackLink, EmptyState, Spinner } from '@/components/ui'
import { IconSparkle } from '@/components/icons'
import { CEFR_LEVELS } from '@/lib/cefr'

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
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await fetch(`/api/admin/videos`)
        if (videoRes.ok) {
          const videoData = await videoRes.json()
          const foundVideo = videoData.videos.find((v: Video) => v.id === videoId)
          if (foundVideo) {
            setVideo(foundVideo)
            setSelectedLevel(
              foundVideo.adminLevel || foundVideo.suggestedLevel || ''
            )
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
    setSaveError('')
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
        router.push('/admin/videos')
      } else {
        setSaveError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell
      title="กำหนดระดับวิดีโอ"
      description="ยืนยันหรือแก้ไขระดับ CEFR ที่ระบบวิเคราะห์ไว้ และผูกวิดีโอเข้ากับคอร์ส"
      actions={<BackLink href="/admin/videos">กลับไปคลังวิดีโอ</BackLink>}
    >
      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูลวิดีโอ...</p>
        </div>
      ) : !video ? (
        <EmptyState
          title="ไม่พบวิดีโอนี้"
          description="วิดีโออาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
          action={
            <Link href="/admin/videos" className="btn btn-primary">
              กลับไปคลังวิดีโอ
            </Link>
          }
        />
      ) : (
        <div className="max-w-2xl space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">{video.title}</h2>
            {video.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {video.description}
              </p>
            )}
          </section>

          {video.suggestedLevel && (
            <section className="card flex items-start gap-4 p-6">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <IconSparkle />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  ระดับที่ AI เสนอ:{' '}
                  <span className="tabular-nums">{video.suggestedLevel}</span>
                </p>
                {video.analysisSummary && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {video.analysisSummary}
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
              การกำหนดค่า
            </h2>

            <div className="space-y-6 p-6">
              <div>
                <span className="label">ระดับ CEFR ที่ใช้จริง</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {CEFR_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedLevel(level)}
                      className={`rounded-lg border py-2.5 text-sm font-semibold tabular-nums transition-colors ${
                        selectedLevel === level
                          ? 'border-brand-800 bg-brand-800 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="course" className="label">
                  ผูกเข้ากับคอร์ส (ไม่บังคับ)
                </label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="input"
                >
                  <option value="">ไม่ผูกกับคอร์สใด</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.minCefrLevel}+)
                    </option>
                  ))}
                </select>
              </div>

              {saveError && (
                <div className="notice notice-error" role="alert">
                  {saveError}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-6 py-5">
              <button
                onClick={handleSave}
                disabled={saving || !selectedLevel}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการเปลี่ยนแปลง'
                )}
              </button>
              <Link href="/admin/videos" className="btn btn-secondary">
                ยกเลิก
              </Link>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  )
}
