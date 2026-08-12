'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminShell } from '@/components/admin-shell'
import { CefrBadge, EmptyState, Spinner } from '@/components/ui'
import { IconClock, IconPlus, IconSparkle } from '@/components/icons'

interface Video {
  id: string
  title: string
  description?: string
  duration: number
  suggestedLevel?: string
  adminLevel?: string
  analyzed: boolean
  analysisSummary?: string
  createdAt: string
}

export default function AdminVideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/admin/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      } else if (response.status === 401 || response.status === 403) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const response = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
        }),
      })

      if (response.ok) {
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          duration: '',
        })
        setShowUploadForm(false)
        await fetchVideos()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('ยืนยันการลบวิดีโอนี้ออกจากระบบ?')) return

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchVideos()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <AdminShell
      title="คลังวิดีโอ"
      description="อัปโหลดคลิปบทเรียน ตรวจสอบระดับที่ AI เสนอ และกำหนดระดับ CEFR ที่ใช้จริง"
      actions={
        <button
          onClick={() => setShowUploadForm((v) => !v)}
          className="btn btn-primary btn-sm"
        >
          {showUploadForm ? (
            'ปิดแบบฟอร์ม'
          ) : (
            <>
              <IconPlus className="h-4 w-4" />
              อัปโหลดวิดีโอ
            </>
          )}
        </button>
      }
    >
      {showUploadForm && (
        <section className="card mb-8 overflow-hidden">
          <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
            อัปโหลดวิดีโอใหม่
          </h2>
          <form onSubmit={handleUpload} className="space-y-5 p-6">
            <div>
              <label htmlFor="title" className="label">
                ชื่อวิดีโอ
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="เช่น English Grammar Basics"
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
                className="input"
                placeholder="รายละเอียดเนื้อหาในวิดีโอ — ใช้ประกอบการวิเคราะห์ระดับด้วย AI"
                rows={3}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="videoUrl" className="label">
                  URL ของวิดีโอ
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label htmlFor="duration" className="label">
                  ความยาว (วินาที)
                </label>
                <input
                  id="duration"
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="600"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 pt-5">
              <button type="submit" disabled={uploading} className="btn btn-primary">
                {uploading ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  'อัปโหลด'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
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
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดรายการวิดีโอ...</p>
        </div>
      ) : videos.length > 0 ? (
        <div className="space-y-4">
          {videos.map((video) => {
            const activeLevel = video.adminLevel || video.suggestedLevel

            return (
              <article key={video.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{video.title}</h3>
                    {video.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        {video.description}
                      </p>
                    )}
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <IconClock className="h-3.5 w-3.5" />
                      {Math.round(video.duration / 60)} นาที
                    </p>
                  </div>

                  <div className="text-right">
                    {activeLevel ? (
                      <>
                        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                          {video.adminLevel ? 'ระดับที่กำหนด' : 'ระดับที่ AI เสนอ'}
                        </p>
                        <CefrBadge level={activeLevel} />
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">ยังไม่ระบุระดับ</span>
                    )}
                  </div>
                </div>

                <div
                  className={`mt-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                    video.analyzed
                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <IconSparkle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {video.analyzed ? (
                    <span className="leading-relaxed">
                      <strong className="font-semibold text-slate-900">
                        ผลวิเคราะห์ AI:
                      </strong>{' '}
                      เสนอระดับ {video.suggestedLevel ?? '—'}
                      {video.analysisSummary && ` — ${video.analysisSummary}`}
                    </span>
                  ) : (
                    <span>กำลังรอผลวิเคราะห์จาก AI</span>
                  )}
                </div>

                <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="btn btn-danger btn-sm"
                  >
                    ลบ
                  </button>
                  <Link
                    href={`/admin/videos/${video.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    แก้ไขระดับ
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีวิดีโอในระบบ"
          description="เริ่มต้นด้วยการอัปโหลดคลิปบทเรียนแรก ระบบจะวิเคราะห์ระดับ CEFR ให้อัตโนมัติ"
          action={
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn btn-primary"
            >
              อัปโหลดวิดีโอแรก
            </button>
          }
        />
      )}
    </AdminShell>
  )
}
