'use client'

import { useState, useEffect } from 'react'
import { AdminShell } from '@/components/admin-shell'
import { Spinner } from '@/components/ui'

interface OpenAISettings {
  configured: boolean
  source: 'env' | 'database' | 'none'
  maskedKey: string | null
  model: string
  defaultModel: string
  editable: boolean
}

/** โมเดลที่แนะนำ เรียงจากถูกไปแพง พร้อมบอกว่าเหมาะกับงานแบบไหน */
const MODELS = [
  { id: 'gpt-4o-mini', label: 'gpt-4o-mini', hint: 'ถูกและเร็ว เหมาะกับงานที่เรียกบ่อย เช่น อธิบายคำตอบ' },
  { id: 'gpt-4o', label: 'gpt-4o', hint: 'ฉลาดกว่า เหมาะกับการแนะนำคอร์สและสรุปสถิติ' },
  { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini', hint: 'สมดุลระหว่างราคากับความสามารถ' },
  { id: 'gpt-4.1', label: 'gpt-4.1', hint: 'ใช้กับงานที่ต้องแม่นที่สุด เช่น ออกข้อสอบ' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<OpenAISettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const load = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.openai)
        setModel(data.openai.model)
      }
    } catch {
      setFeedback({ ok: false, text: 'โหลดค่าตั้งไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), model }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFeedback({ ok: false, text: data.error || 'บันทึกไม่สำเร็จ' })
        return
      }
      setFeedback({ ok: true, text: data.message })
      // ล้างช่องกรอกทันทีหลังบันทึก คีย์จะได้ไม่ค้างอยู่ในหน้าจอ
      setApiKey('')
      await load()
    } catch {
      setFeedback({ ok: false, text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/settings/test', { method: 'POST' })
      const data = await response.json()
      setFeedback({ ok: Boolean(data.ok), text: data.message })
    } catch {
      setFeedback({ ok: false, text: 'ทดสอบไม่สำเร็จ' })
    } finally {
      setTesting(false)
    }
  }

  const remove = async () => {
    if (!confirm('ลบคีย์ออกจากระบบ? ฟีเจอร์ที่ใช้ AI จะหยุดทำงานจนกว่าจะตั้งค่าใหม่')) return
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', { method: 'DELETE' })
      const data = await response.json()
      setFeedback({ ok: Boolean(data.ok), text: data.message || data.error })
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell
      title="ตั้งค่าระบบ"
      description="เชื่อมต่อบริการภายนอกที่ระบบใช้สนับสนุนการตัดสินใจของผู้ใช้งาน"
    >
      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดค่าตั้ง...</p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {/* สถานะปัจจุบัน */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">OpenAI API</h2>
              {settings?.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                  เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                  ยังไม่ได้ตั้งค่า
                </span>
              )}
            </div>

            <dl className="divide-y divide-slate-100">
              <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                <dt className="text-slate-500">คีย์ปัจจุบัน</dt>
                <dd className="font-mono text-slate-900">
                  {settings?.maskedKey ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                <dt className="text-slate-500">แหล่งที่มา</dt>
                <dd className="text-slate-900">
                  {settings?.source === 'env'
                    ? 'ตัวแปรสภาพแวดล้อมของเซิร์ฟเวอร์'
                    : settings?.source === 'database'
                      ? 'กรอกผ่านหน้านี้ (เข้ารหัสเก็บไว้)'
                      : 'ยังไม่มี'}
                </dd>
              </div>
              <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                <dt className="text-slate-500">โมเดลที่ใช้</dt>
                <dd className="font-mono text-slate-900">{settings?.model}</dd>
              </div>
            </dl>

            {settings?.configured && (
              <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={test}
                  disabled={testing}
                  className="btn btn-secondary btn-sm"
                >
                  {testing ? (
                    <>
                      <Spinner className="h-3.5 w-3.5" />
                      กำลังทดสอบ...
                    </>
                  ) : (
                    'ทดสอบการเชื่อมต่อ'
                  )}
                </button>
                {settings.source === 'database' && (
                  <button
                    onClick={remove}
                    disabled={saving}
                    className="btn btn-sm border border-red-200 bg-white text-red-700 hover:border-red-300"
                  >
                    ลบคีย์
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ผลลัพธ์ของการบันทึกหรือทดสอบ */}
          {feedback && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                feedback.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* ฟอร์มกรอกคีย์ */}
          {settings?.editable ? (
            <section className="card overflow-hidden">
              <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
                {settings.configured ? 'เปลี่ยนคีย์' : 'ตั้งค่าคีย์'}
              </h2>

              <div className="space-y-5 p-6">
                <div>
                  <label htmlFor="apiKey" className="label">
                    OpenAI API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                    spellCheck={false}
                    className="input font-mono"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    สร้างคีย์ได้ที่{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand-800 hover:underline"
                    >
                      platform.openai.com/api-keys
                    </a>{' '}
                    · ต้องเติมเครดิตที่{' '}
                    <a
                      href="https://platform.openai.com/settings/organization/billing"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand-800 hover:underline"
                    >
                      หน้า Billing
                    </a>{' '}
                    ก่อน ไม่งั้นคีย์จะเรียกใช้ไม่ได้
                  </p>
                </div>

                <div>
                  <label htmlFor="model" className="label">
                    โมเดล
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="input"
                  >
                    {MODELS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    {MODELS.find((m) => m.id === model)?.hint}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>
                        <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                        กำลังทดสอบและบันทึก...
                      </>
                    ) : (
                      'บันทึก'
                    )}
                  </button>
                  <p className="text-xs text-slate-500">
                    ระบบจะเรียก OpenAI จริงหนึ่งครั้งเพื่อทดสอบก่อน ถ้าคีย์ใช้ไม่ได้จะไม่บันทึก
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              คีย์ถูกตั้งผ่านตัวแปรสภาพแวดล้อม <code className="font-mono">OPENAI_API_KEY</code>{' '}
              ของเซิร์ฟเวอร์ ซึ่งมีลำดับความสำคัญสูงกว่าค่าที่กรอกในหน้านี้
              หากต้องการแก้ ให้แก้ที่ Vercel แล้ว redeploy
            </div>
          )}

          {/* อธิบายว่าคีย์ถูกเก็บอย่างไร */}
          <section className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">คีย์ถูกเก็บอย่างไร</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <li>
                • คีย์ถูก<strong>เข้ารหัสด้วย AES-256-GCM</strong> ก่อนบันทึกลงฐานข้อมูลเสมอ
                ไม่ได้เก็บเป็นข้อความธรรมดา
              </li>
              <li>
                • ระบบ<strong>ไม่เคยส่งคีย์เต็มกลับมาที่เบราว์เซอร์</strong> หน้านี้เห็นเพียงรูปแบบปิดบัง
                การเรียก OpenAI ทั้งหมดเกิดที่ฝั่งเซิร์ฟเวอร์
              </li>
              <li>
                • ถ้าตั้ง <code className="font-mono text-xs">OPENAI_API_KEY</code> ไว้ที่เซิร์ฟเวอร์
                ค่านั้นจะถูกใช้ก่อนค่าที่กรอกที่นี่เสมอ
              </li>
              <li>
                • เมื่อไม่มีคีย์ ระบบหลักยังทำงานได้ตามปกติ เฉพาะฟีเจอร์ที่ใช้ AI เท่านั้นที่จะปิดไว้
              </li>
            </ul>
          </section>
        </div>
      )}
    </AdminShell>
  )
}
