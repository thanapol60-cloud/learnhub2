'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { describeLevel, isSubjectKey, SUBJECTS, SubjectKey } from '@/lib/subjects'
import { BrandMark } from '@/components/brand-mark'
import { CefrBadge, Spinner } from '@/components/ui'
import { IconArrowRight, IconCheck, IconClose } from '@/components/icons'
import { TOTAL_QUESTIONS_PER_ATTEMPT } from '@/lib/assessment'

const TOTAL_QUESTIONS = TOTAL_QUESTIONS_PER_ATTEMPT
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

interface Question {
  id: string
  passage?: string | null
  question: string
  options: Array<{ text: string; isCorrect: boolean }>
  cefrLevel: string
  category?: string
}

interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  newLevel: string
  levelChange: 'up' | 'down' | null
  totalAnswered: number
  correctAnswers: number
}

function ExamHeader({
  level,
  answered,
  correct,
  showing,
  subjectName,
}: {
  level: string
  answered: number
  correct: number
  showing: number
  subjectName: string
}) {
  const progress = Math.min((answered / TOTAL_QUESTIONS) * 100, 100)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="container-narrow flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="h-8 w-8" />
          <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:block">
            แบบประเมินระดับ{subjectName}
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              ระดับปัจจุบัน
            </p>
            <div className="mt-0.5">
              <CefrBadge level={level} />
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              ตอบถูก
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
              {correct}/{answered}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              ข้อที่
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
              {showing} / {TOTAL_QUESTIONS}
            </p>
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-1 bg-brand-800 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  )
}

function AssessmentRunner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ไม่ระบุวิชาถือว่าเป็นภาษาอังกฤษ ลิงก์เดิมจึงยังใช้ได้
  const subjectParam = searchParams.get('subject')
  const subject: SubjectKey = isSubjectKey(subjectParam) ? subjectParam : 'english'
  const definition = SUBJECTS[subject]

  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState<Question | null>(null)
  const [currentLevel, setCurrentLevel] = useState<string>(definition.levels[0])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadQuestion = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/question?subject=${subject}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'ไม่สามารถโหลดคำถามได้')
        setQuestion(null)
        return
      }

      setQuestion(data.question)
      setCurrentLevel(data.currentLevel)
      setAnswered(data.totalAnswered)
      setCorrect(data.correctAnswers)
      setSelected(null)
      setResult(null)
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }, [subject])

  useEffect(() => {
    loadQuestion()
  }, [loadQuestion])

  const submitAnswer = async () => {
    if (!selected || !question || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/assessment/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, userAnswer: selected }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'ไม่สามารถบันทึกคำตอบได้')
        return
      }

      setResult(data)
      setCurrentLevel(data.newLevel)
      setAnswered(data.totalAnswered)
      setCorrect(data.correctAnswers)
    } catch {
      setError('เกิดข้อผิดพลาดในการส่งคำตอบ')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => {
    if (answered >= TOTAL_QUESTIONS) {
      router.push(`/result?subject=${subject}`)
    } else {
      loadQuestion()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="text-center">
            <Spinner className="mx-auto h-8 w-8" />
            <p className="mt-4 text-sm text-slate-500">
              กำลังเตรียมคำถามสำหรับคุณ...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700">
            <IconClose className="h-5 w-5" />
          </span>
          <p className="mt-5 font-medium text-slate-900">{error}</p>
          <div className="mt-6 space-y-3">
            {answered > 0 && (
              <button
                onClick={() => router.push(`/result?subject=${subject}`)}
                className="btn btn-primary w-full"
              >
                ดูผลประเมินจาก {answered} ข้อที่ทำแล้ว
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="btn btn-secondary w-full"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    )
  }

  const showing = Math.min(answered + (result ? 0 : 1), TOTAL_QUESTIONS)

  return (
    <div className="min-h-screen bg-slate-50">
      <ExamHeader
        level={currentLevel}
        answered={answered}
        correct={correct}
        showing={showing}
        subjectName={definition.name}
      />

      <main className="container-narrow py-10 sm:py-14">
        {question && (
          <article className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-3.5">
              <p className="eyebrow">คำถามที่ {showing}</p>
              <CefrBadge level={question.cefrLevel} />
            </div>

            <div className="p-6 sm:p-8">
              {/* หมวด reading: บทความอ่านต้องแยกออกจากตัวคำถามให้ชัด */}
              {question.passage && (
                <figure className="mb-6 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
                  <figcaption className="eyebrow mb-3">อ่านบทความต่อไปนี้</figcaption>
                  <p className="whitespace-pre-line text-[15px] leading-[1.9] text-slate-800">
                    {question.passage}
                  </p>
                </figure>
              )}

              <h1 className="text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
                {question.question}
              </h1>

              <div className="mt-7 space-y-2.5">
                {question.options.map((option, index) => {
                  const isChosen = selected === option.text
                  const isRightAnswer =
                    result != null && option.text === result.correctAnswer

                  let box = 'border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/40'
                  let marker = 'border-slate-300 text-slate-500'

                  if (result) {
                    if (isRightAnswer) {
                      box = 'border-emerald-300 bg-emerald-50/70'
                      marker = 'border-emerald-500 bg-emerald-600 text-white'
                    } else if (isChosen) {
                      box = 'border-red-300 bg-red-50/70'
                      marker = 'border-red-500 bg-red-600 text-white'
                    } else {
                      box = 'border-slate-200 bg-white opacity-55'
                    }
                  } else if (isChosen) {
                    box = 'border-brand-700 bg-brand-50 ring-1 ring-brand-700'
                    marker = 'border-brand-700 bg-brand-800 text-white'
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !result && setSelected(option.text)}
                      disabled={result != null}
                      className={`flex w-full items-start gap-4 rounded-lg border px-4 py-3.5 text-left transition-all ${box} ${
                        result ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${marker}`}
                      >
                        {OPTION_LETTERS[index] ?? index + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-slate-800">
                        {option.text}
                      </span>
                    </button>
                  )
                })}
              </div>

              {result && (
                <div className="mt-7 space-y-3">
                  <div
                    className={`rounded-lg border p-4 ${
                      result.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-red-200 bg-red-50/70'
                    }`}
                  >
                    <p
                      className={`flex items-center gap-2 text-sm font-semibold ${
                        result.isCorrect ? 'text-emerald-800' : 'text-red-800'
                      }`}
                    >
                      {result.isCorrect ? (
                        <IconCheck className="h-4 w-4" />
                      ) : (
                        <IconClose className="h-4 w-4" />
                      )}
                      {result.isCorrect ? 'ตอบถูกต้อง' : 'คำตอบยังไม่ถูกต้อง'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {result.explanation}
                    </p>
                  </div>

                  {result.levelChange === 'up' && (
                    <div className="notice notice-info flex items-start gap-3">
                      <span className="mt-0.5 font-semibold text-brand-800">↑</span>
                      <span>
                        <strong className="font-semibold text-slate-900">
                          เลื่อนขึ้นสู่ระดับ {result.newLevel}
                        </strong>
                        <br />
                        ตอบถูกติดต่อกัน 3 ข้อ คำถามถัดไปจะยากขึ้น
                      </span>
                    </div>
                  )}

                  {result.levelChange === 'down' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                      <strong className="font-semibold">
                        ปรับลงสู่ระดับ {result.newLevel}
                      </strong>
                      <br />
                      ตอบผิดติดต่อกัน 2 ข้อ คำถามถัดไปจะง่ายลง
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 border-t border-slate-200 pt-6">
                {!result ? (
                  <button
                    onClick={submitAnswer}
                    disabled={!selected || submitting}
                    className="btn btn-primary btn-lg w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Spinner className="h-4 w-4 border-white/30 border-t-white" />
                        กำลังตรวจคำตอบ...
                      </>
                    ) : (
                      'ตรวจคำตอบ'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="btn btn-primary btn-lg w-full sm:w-auto"
                  >
                    {answered >= TOTAL_QUESTIONS ? 'ดูผลการประเมิน' : 'คำถามถัดไป'}
                    <IconArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </article>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          ระดับที่ประเมินได้ขณะนี้: {currentLevel} — {describeLevel(subject, currentLevel)}
        </p>
        <p className="mt-1 text-center text-[11px] text-slate-400">
          เกณฑ์: {definition.framework}
        </p>
      </main>
    </div>
  )
}

// useSearchParams ต้องอยู่ใต้ Suspense ไม่งั้น Next.js จะบังคับให้ทั้งหน้าเรนเดอร์ฝั่งไคลเอนต์
export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <AssessmentRunner />
    </Suspense>
  )
}
