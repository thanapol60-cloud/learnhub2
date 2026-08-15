'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Spinner } from './ui'

interface Message {
  role: 'user' | 'assistant'
  content: string
  link?: { label: string; href: string }
  /** ตอบมาจากชั้นไหน ใช้แสดงให้ผู้ใช้รู้ว่าคำตอบมาจากข้อมูลจริงหรือจาก AI */
  source?: 'data' | 'faq' | 'ai' | 'fallback'
}

const SOURCE_LABEL: Record<string, string> = {
  data: 'จากข้อมูลของคุณ',
  faq: 'คำถามที่พบบ่อย',
  ai: 'ตอบโดย AI',
}

/** คำถามตัวอย่างให้กดได้เลย ลดการพิมพ์และช่วยให้ผู้ใช้รู้ว่าถามอะไรได้บ้าง */
const SUGGESTIONS = [
  'ฉันอยู่ระดับอะไร',
  'สอบกี่ข้อ ใช้เวลานานไหม',
  'จ่ายเงินยังไง',
  'ทำไมยังดูวิดีโอไม่ได้',
]

export function ChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // ไม่แสดงในคอนโซลผู้ดูแลและหน้าทำข้อสอบ
  // หน้าทำข้อสอบสำคัญเป็นพิเศษ — ผู้ช่วยที่ลอยอยู่ระหว่างสอบชวนให้เข้าใจผิดว่าถามคำตอบได้
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/assessment')) {
    return null
  }

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || sending) return

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    setSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      })
      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer ?? data.error ?? 'ขออภัย ตอบไม่ได้ในขณะนี้',
          link: data.link,
          source: data.source,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ปุ่มเปิด */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="เปิดผู้ช่วยตอบคำถาม"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-800 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-900"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* หน้าต่างสนทนา */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-brand-950 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">ผู้ช่วยตอบคำถาม</p>
              <p className="text-[11px] text-white/60">ถามเรื่องการสอบ คอร์ส และการชำระเงินได้</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="ปิด"
              className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-600">
                  สวัสดีครับ ถามได้เลยว่าอยากรู้อะไรเกี่ยวกับ LearnHub
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-brand-800 text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.content}

                  {message.link && (
                    <Link
                      href={message.link.href}
                      onClick={() => setOpen(false)}
                      className="mt-2 block text-xs font-semibold text-brand-800 underline"
                    >
                      {message.link.label} →
                    </Link>
                  )}

                  {message.role === 'assistant' && message.source && SOURCE_LABEL[message.source] && (
                    <p className="mt-1.5 text-[10px] uppercase tracking-wide text-slate-400">
                      {SOURCE_LABEL[message.source]}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <Spinner className="h-4 w-4" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
            className="flex gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="พิมพ์คำถาม..."
              maxLength={500}
              className="input flex-1 text-sm"
              aria-label="คำถามของคุณ"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-primary btn-sm shrink-0"
            >
              ส่ง
            </button>
          </form>
        </div>
      )}
    </>
  )
}
