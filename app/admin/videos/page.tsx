'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบวิดีโอนี้?')) return

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
              ← กลับ
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">จัดการวิดีโอ</h1>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + อัพโหลดวิดีโอใหม่
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">อัพโหลดวิดีโอใหม่</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  ชื่อวิดีโอ
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น English Grammar Basics"
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
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="รายละเอียดเกี่ยวกับวิดีโอ"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  URL ของวิดีโอ
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  ระยะเวลา (วินาที)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="600"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลด...</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {video.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {video.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {video.duration}s
                    </span>
                  </div>
                </div>

                {/* AI Analysis Results */}
                {video.analyzed ? (
                  <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-green-800 mb-2">
                          ✓ AI Analysis Complete
                        </p>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Suggested Level:</strong>{' '}
                          <span className="font-bold text-lg text-green-600">
                            {video.suggestedLevel}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700">
                          {video.analysisSummary}
                        </p>
                      </div>
                      {video.adminLevel && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Admin Level:</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {video.adminLevel}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⏳ Analyzing with AI...
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/admin/videos/${video.id}`}
                    className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 text-center"
                  >
                    แก้ไข
                  </Link>
                  <button
                    onClick={() => handleDelete(video.id)}
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
            <p className="text-blue-800 mb-4">ยังไม่มีวิดีโอ</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            >
              อัพโหลดวิดีโอแรก
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
