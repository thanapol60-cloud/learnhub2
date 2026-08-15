'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CefrBadge, LoadingScreen, PageHeader, Spinner } from '@/components/ui'
import { isSubjectKey, SUBJECTS, SUBJECT_KEYS, SubjectKey } from '@/lib/subjects'

interface Feedback {
  estimatedLevel: string
  confidence: number
  strengths: string[]
  issues: Array<{ original: string; corrected: string; explanation: string }>
  nextStep: string
}

function WritingPractice() {
  const searchParams = useSearchParams()
  const initial = searchParams.get('subject')
  const [subject, setSubject] = useState<SubjectKey>(
    isSubjectKey(initial) ? initial : 'english'
  )

  const [level, setLevel] = useState('')
  const [prompts, setPrompts] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [minWords, setMinWords] = useState(15)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFeedback(null)
    setText('')
    fetch(`/api/ai/writing?subject=${subject}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setLevel(data.level)
        setPrompts(data.prompts)
        setPrompt(data.prompts[0] ?? '')
        setMinWords(data.minWords)
      })
      .finally(() => setLoading(false))
  }, [subject])

  const words =
    subject === 'english'
      ? text.trim().split(/\s+/).filter(Boolean).length
      : Math.round(text.replace(/\s+/g, '').length / 4)

  const submit = async () => {
    setChecking(true)
    setError(null)
    setFeedback(null)
    try {
      const response = await fetch('/api/ai/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, prompt, text }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'ตรวจไม่สำเร็จ')
        return
      }
      if (!data.available) {
        setError(data.message)
        return
      }
      setFeedback(data.feedback)
    } catch {
      setError('เชื่อมต่อไม่สำเร็จ')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="container-narrow py-10">
        <PageHeader
          eyebrow="ฝึกเขียน"
          title="ตรวจงานเขียนด้วย AI"
          description="ข้อสอบปรนัยวัดได้ว่าคุณเลือกข้อถูกไหม แต่วัดไม่ได้ว่าคุณเขียนเองได้ไหม หน้านี้ให้คุณเขียนจริงแล้วรับผลตรวจเป็นรายจุด"
        />

        {/* เลือกวิชา */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            วิชา
          </span>
          {SUBJECT_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setSubject(key)}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                subject === key
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {SUBJECTS[key].name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Spinner className="mx-auto h-8 w-8" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">เลือกโจทย์</h2>
                {level && (
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    ระดับปัจจุบันของคุณ <CefrBadge level={level} />
                  </span>
                )}
              </div>
              <div className="space-y-2 p-6">
                {prompts.map((item) => (
                  <button
                    key={item}
                    onClick={() => setPrompt(item)}
                    className={`block w-full rounded-lg border px-4 py-3 text-left text-sm leading-relaxed transition-colors ${
                      prompt === item
                        ? 'border-brand-800 bg-brand-50 text-brand-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="card overflow-hidden">
              <h2 className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900">
                เขียนคำตอบของคุณ
              </h2>
              <div className="p-6">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={10}
                  maxLength={3000}
                  placeholder={
                    subject === 'english'
                      ? 'Write your answer here...'
                      : 'อธิบายวิธีคิดของคุณที่นี่...'
                  }
                  className="input resize-y leading-relaxed"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`text-xs tabular-nums ${
                      words >= minWords ? 'text-slate-500' : 'text-amber-700'
                    }`}
                  >
                    ประมาณ {words} คำ {words < minWords && `(ต้องอย่างน้อย ${minWords} คำ)`}
                  </span>
                  <button
                    onClick={submit}
                    disabled={checking || words < minWords}
                    className="btn btn-primary"
                  >
                    {checking ? (
                      <>
                        <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                        กำลังตรวจ...
                      </>
                    ) : (
                      'ตรวจงานเขียน'
                    )}
                  </button>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </div>
            )}

            {feedback && (
              <section className="space-y-5">
                <div className="card p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="rule-label">ระดับที่ประเมินจากงานเขียนชิ้นนี้</p>
                      <div className="mt-2 flex items-end gap-3">
                        <span className="text-4xl font-semibold tracking-tight text-slate-900">
                          {feedback.estimatedLevel}
                        </span>
                        <span className="pb-1.5 text-sm text-slate-500">
                          ความมั่นใจ {feedback.confidence}%
                        </span>
                      </div>
                    </div>
                    {level && feedback.estimatedLevel !== level && (
                      <p className="text-xs leading-relaxed text-slate-500">
                        ต่างจากระดับปรนัยของคุณ ({level})
                        <br />
                        การเขียนกับการเลือกตอบเป็นคนละทักษะ
                      </p>
                    )}
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <h3 className="border-b border-slate-200 px-6 py-3.5 text-sm font-semibold text-emerald-800">
                    สิ่งที่ทำได้ดี
                  </h3>
                  <ul className="space-y-2 px-6 py-4 text-sm leading-relaxed text-slate-700">
                    {feedback.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                {feedback.issues.length > 0 && (
                  <div className="card overflow-hidden">
                    <h3 className="border-b border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-900">
                      จุดที่ควรแก้
                    </h3>
                    <ul className="divide-y divide-slate-100">
                      {feedback.issues.map((issue, i) => (
                        <li key={i} className="px-6 py-4">
                          <p className="text-sm text-red-800 line-through decoration-red-300">
                            {issue.original}
                          </p>
                          <p className="mt-1 text-sm font-medium text-emerald-800">
                            {issue.corrected}
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            {issue.explanation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-5 py-4">
                  <p className="text-sm leading-relaxed text-brand-900">
                    <span className="font-semibold">ควรฝึกต่อ: </span>
                    {feedback.nextStep}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setText('')} className="btn btn-secondary">
                    เขียนใหม่อีกครั้ง
                  </button>
                  <Link href="/courses" className="btn btn-secondary">
                    ดูคอร์สเรียน
                  </Link>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default function WritingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <SiteHeader />
          <LoadingScreen label="กำลังเตรียมหน้าฝึกเขียน..." />
        </div>
      }
    >
      <WritingPractice />
    </Suspense>
  )
}
