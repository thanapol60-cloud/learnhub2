'use client'

import { useState } from 'react'
import { CEFR_LEVELS } from '@/lib/cefr'

/**
 * ระดับความสามารถเป็นสเกลแบบเรียงลำดับ (ขั้นแรกต่ำสุด → ขั้นสุดท้ายสูงสุด) ไม่ใช่หมวดที่ไม่มีลำดับ
 * สีจึงเป็นเฉดเดียวไล่จากอ่อนไปเข้ม ความสว่างลดลงทีละขั้น อ่านเป็น "ความก้าวหน้า" ได้ทันที
 * ตัวอักษรระดับ + จำนวน + เปอร์เซ็นต์กำกับอยู่ในคำอธิบายเสมอ จึงไม่ได้ใช้สีบอกความหมายลำพัง
 *
 * ทุกวิชามีหกระดับเท่ากัน จึงใช้ไล่เฉดชุดเดียวกันโดยอ้างอิงตำแหน่งของระดับ ไม่ใช่ชื่อระดับ
 */
const RAMP = ['#9dbadd', '#6c95c9', '#4975b1', '#375c95', '#2d4a79', '#1e3252']

const SIZE = 260
const RADIUS = 108
const THICKNESS = 34
const GAP_DEGREES = 1.6 // ช่องว่างสีพื้นระหว่างชิ้น ทำให้ขอบแต่ละชิ้นชัดแม้เฉดใกล้กัน

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function arcPath(startAngle: number, endAngle: number, outer: number, inner: number) {
  const cx = SIZE / 2
  const cy = SIZE / 2
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const outerStart = polar(cx, cy, outer, startAngle)
  const outerEnd = polar(cx, cy, outer, endAngle)
  const innerEnd = polar(cx, cy, inner, endAngle)
  const innerStart = polar(cx, cy, inner, startAngle)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export function CefrDonut({
  distribution,
  levels = CEFR_LEVELS as unknown as string[],
}: {
  distribution: Record<string, number>
  /** ระดับของวิชาที่กำลังแสดง เรียงจากต่ำไปสูง */
  levels?: string[]
}) {
  const [active, setActive] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)

  const slices = levels.map((level, index) => ({
    level,
    count: distribution[level] ?? 0,
    fill: RAMP[index % RAMP.length],
  }))
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  const shown = active ?? pinned
  const focused = shown ? slices.find((slice) => slice.level === shown) : null

  // มุมของแต่ละชิ้น คิดเฉพาะระดับที่มีผู้เรียน เพื่อไม่ให้ระดับที่เป็น 0 กินช่องว่าง
  const present = slices.filter((slice) => slice.count > 0)
  let cursor = 0
  const arcs = present.map((slice) => {
    const sweep = (slice.count / total) * 360
    const start = cursor
    cursor += sweep
    return { ...slice, start, end: start + sweep, sweep }
  })

  const inner = RADIUS - THICKNESS

  return (
    <div className="grid gap-8 sm:grid-cols-[260px_1fr] sm:items-center">
      <div className="relative mx-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={
            total > 0
              ? `สัดส่วนผู้เรียนตามระดับ CEFR: ${slices
                  .filter((s) => s.count > 0)
                  .map((s) => `${s.level} ${s.count} คน`)
                  .join(', ')}`
              : 'ยังไม่มีข้อมูลผู้เรียน'
          }
          className="block"
        >
          {total === 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={(RADIUS + inner) / 2}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={THICKNESS}
            />
          )}

          {arcs.map((arc) => {
            const isFocused = shown === arc.level
            const dimmed = Boolean(shown) && !isFocused
            // ชิ้นเดียวเต็มวง วาดเป็นวงแหวนแทน เพราะ arc ที่จุดเริ่ม=จุดจบจะไม่ปรากฏ
            if (arc.sweep >= 359.9) {
              return (
                <circle
                  key={arc.level}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={(RADIUS + inner) / 2}
                  fill="none"
                  stroke={arc.fill}
                  strokeWidth={THICKNESS}
                  opacity={dimmed ? 0.35 : 1}
                  onMouseEnter={() => setActive(arc.level)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setPinned(pinned === arc.level ? null : arc.level)}
                  className="cursor-pointer transition-opacity duration-150"
                />
              )
            }
            const gap = Math.min(GAP_DEGREES, arc.sweep / 4)
            return (
              <path
                key={arc.level}
                d={arcPath(
                  arc.start + gap / 2,
                  arc.end - gap / 2,
                  isFocused ? RADIUS + 6 : RADIUS,
                  isFocused ? inner + 2 : inner
                )}
                fill={arc.fill}
                opacity={dimmed ? 0.35 : 1}
                onMouseEnter={() => setActive(arc.level)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setPinned(pinned === arc.level ? null : arc.level)}
                className="cursor-pointer transition-all duration-150"
              />
            )
          })}
        </svg>

        {/* ค่ากลางวง: ค่ารวมตามปกติ และเปลี่ยนเป็นระดับที่ชี้อยู่เมื่อมีการโต้ตอบ */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {focused ? (
            <>
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {focused.level}
              </span>
              <span className="mt-1 text-sm tabular-nums text-slate-600">
                {focused.count} คน
              </span>
              <span className="text-xs tabular-nums text-slate-500">
                {total > 0 ? ((focused.count / total) * 100).toFixed(1) : '0.0'}%
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                {total}
              </span>
              <span className="mt-1 text-xs text-slate-500">ผู้เรียนทั้งหมด</span>
            </>
          )}
        </div>
      </div>

      {/* คำอธิบายสี = ตัวบอกตัวตนหลัก กดเลือกได้และใช้คีย์บอร์ดได้ */}
      <ul className="w-full max-w-sm space-y-1">
        {slices.map((slice) => {
          const percent = total > 0 ? (slice.count / total) * 100 : 0
          const isFocused = shown === slice.level
          return (
            <li key={slice.level}>
              <button
                type="button"
                onMouseEnter={() => setActive(slice.level)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(slice.level)}
                onBlur={() => setActive(null)}
                onClick={() =>
                  setPinned(pinned === slice.level ? null : slice.level)
                }
                aria-pressed={pinned === slice.level}
                disabled={slice.count === 0}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors ${
                  isFocused ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${slice.count === 0 ? 'cursor-default opacity-60' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-inset ring-black/10"
                  style={{ background: slice.fill }}
                />
                <span className="w-7 text-sm font-semibold tabular-nums text-slate-900">
                  {slice.level}
                </span>
                <span className="flex-1 text-sm tabular-nums text-slate-600">
                  {slice.count} คน
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {percent.toFixed(1)}%
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
