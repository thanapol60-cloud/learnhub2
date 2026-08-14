'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminShell } from '@/components/admin-shell'
import { Spinner, StatCard } from '@/components/ui'
import { IconChart, IconLayers, IconTarget } from '@/components/icons'

interface Agent {
  id: string
  name: string
  supports: string
  purpose: string
  calls: number
  successes: number
  errors: number
  skippedNoKey: number
  promptTokens: number
  outputTokens: number
  avgLatencyMs: number
}

interface UsageRow {
  id: string
  agent: string
  model: string
  status: string
  promptTokens: number
  outputTokens: number
  latencyMs: number
  errorMessage: string | null
  createdAt: string
}

interface AiStatus {
  configured: boolean
  source: 'env' | 'database' | 'none'
  model: string
  agents: Agent[]
  totals: {
    calls: number
    successes: number
    errors: number
    promptTokens: number
    outputTokens: number
  }
  recent: UsageRow[]
}

const STATUS_STYLE: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
  'no-key': 'bg-amber-50 text-amber-800 ring-amber-200',
}

const STATUS_LABEL: Record<string, string> = {
  ok: 'สำเร็จ',
  error: 'ล้มเหลว',
  'no-key': 'ไม่มีคีย์',
}

export default function AdminAiPage() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ai')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminShell
      title="ระบบ AI"
      description="ตัวแทน AI ที่ทำงานเบื้องหลังเพื่อสนับสนุนการตัดสินใจของผู้ใช้งาน พร้อมสถิติการเรียกใช้จริง"
    >
      {loading ? (
        <div className="py-24 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-sm text-slate-500">กำลังโหลดสถานะ...</p>
        </div>
      ) : !status ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          อ่านสถานะระบบ AI ไม่สำเร็จ
        </div>
      ) : (
        <div className="space-y-8">
          {!status.configured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ยังไม่ได้ตั้งค่า OpenAI API key — ตัวแทนทั้งหมดจะข้ามการทำงานและระบบจะใช้ตรรกะเดิมแทน{' '}
              <Link href="/admin/settings" className="font-semibold underline">
                ไปที่หน้าตั้งค่า
              </Link>
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="ตัวแทน AI ในระบบ"
              value={status.agents.length}
              hint={status.configured ? 'พร้อมทำงานทั้งหมด' : 'รอตั้งค่าคีย์'}
              icon={<IconLayers className="h-5 w-5" />}
            />
            <StatCard
              label="เรียกใช้ทั้งหมด"
              value={status.totals.calls}
              hint={`สำเร็จ ${status.totals.successes} · ล้มเหลว ${status.totals.errors}`}
              icon={<IconTarget className="h-5 w-5" />}
            />
            <StatCard
              label="โทเคนที่ใช้"
              value={(status.totals.promptTokens + status.totals.outputTokens).toLocaleString()}
              hint={`เข้า ${status.totals.promptTokens.toLocaleString()} · ออก ${status.totals.outputTokens.toLocaleString()}`}
              icon={<IconChart className="h-5 w-5" />}
            />
            <StatCard
              label="โมเดลที่ใช้"
              value={status.model}
              hint={status.source === 'env' ? 'คีย์จากเซิร์ฟเวอร์' : 'คีย์จากหน้าตั้งค่า'}
              icon={<IconLayers className="h-5 w-5" />}
            />
          </section>

          {/* ตัวแทนแต่ละตัว */}
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
              ตัวแทน AI ทั้งหมด
            </h2>
            <div className="divide-y divide-slate-100">
              {status.agents.map((agent) => (
                <div key={agent.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{agent.name}</h3>
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                          {agent.id}
                        </span>
                        <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                          สนับสนุน{agent.supports}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
                        {agent.purpose}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {agent.calls === 0 ? (
                        <span className="text-xs text-slate-400">ยังไม่เคยเรียก</span>
                      ) : (
                        <>
                          <p className="text-sm font-semibold tabular-nums text-slate-900">
                            {agent.successes}/{agent.calls} สำเร็จ
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                            เฉลี่ย {(agent.avgLatencyMs / 1000).toFixed(1)} วินาที ·{' '}
                            {(agent.promptTokens + agent.outputTokens).toLocaleString()} โทเคน
                          </p>
                          {agent.errors > 0 && (
                            <p className="mt-0.5 text-xs text-red-700">
                              ล้มเหลว {agent.errors} ครั้ง
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* บันทึกล่าสุด */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">การเรียกใช้ล่าสุด</h2>
              <span className="text-xs text-slate-500">
                บันทึกทุกครั้ง ทั้งที่สำเร็จและล้มเหลว
              </span>
            </div>

            {status.recent.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                ยังไม่มีการเรียกใช้ — ลองใช้งานฟีเจอร์ที่มี AI แล้วกลับมาดูอีกครั้ง
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-2.5 font-medium">เวลา</th>
                      <th className="px-4 py-2.5 font-medium">ตัวแทน</th>
                      <th className="px-4 py-2.5 font-medium">สถานะ</th>
                      <th className="px-4 py-2.5 text-right font-medium">โทเคน</th>
                      <th className="px-6 py-2.5 text-right font-medium">เวลาตอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {status.recent.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-2.5 text-slate-500">
                          {new Date(row.createdAt).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                          {row.agent}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                            title={row.errorMessage ?? undefined}
                          >
                            {STATUS_LABEL[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                          {row.promptTokens + row.outputTokens || '—'}
                        </td>
                        <td className="px-6 py-2.5 text-right tabular-nums text-slate-600">
                          {(row.latencyMs / 1000).toFixed(1)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">หลักการออกแบบระบบ AI</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <li>
                • <strong>ล้มเหลวแล้วต้องเห็น</strong> — ทุกการเรียกถูกบันทึกพร้อมสถานะ
                ระบบเดิมของโปรเจกต์นี้เคยเรียกโมเดลที่ปลดระวางแล้วล้มเหลวเงียบ ๆ
                โดยตกไปใช้ค่าคงที่ จนดูเหมือนทำงานได้ทั้งที่ไม่เคยสำเร็จเลย
              </li>
              <li>
                • <strong>AI ล่มแล้วระบบต้องไม่ล่ม</strong> — ทุกจุดมีตรรกะเดิมรองรับ
                ผู้เรียนยังสอบและได้คำแนะนำคอร์สเหมือนเดิมแม้ไม่มีคีย์
              </li>
              <li>
                • <strong>ตรวจผลลัพธ์ก่อนใช้</strong> — เช่น ผู้ออกข้อสอบจะให้โมเดลตอบข้อที่ร่างไว้ใหม่
                โดยไม่เห็นเฉลย ถ้าตอบไม่ตรงกับเฉลยที่ร่างไว้จะทิ้งข้อนั้นทันที
              </li>
            </ul>
          </section>
        </div>
      )}
    </AdminShell>
  )
}
