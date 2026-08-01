'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CEFRLevel, CEFR_DESCRIPTIONS } from '@/lib/cefr'

const TOTAL_QUESTIONS = 15

interface Question {
  id: string
  question: string
  options: Array<{ text: string; isCorrect: boolean }>
  cefrLevel: string
}

interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  newLevel: CEFRLevel
  levelChange: 'up' | 'down' | null
  totalAnswered: number
  correctAnswers: number
}

export default function AssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState<Question | null>(null)
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('A1')
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
      const response = await fetch('/api/question')
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
  }, [])

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
      router.push('/result')
    } else {
      loadQuestion()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>กำลังเตรียมคำถามสำหรับคุณ...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          {answered > 0 && (
            <button
              onClick={() => router.push('/result')}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 mb-3"
            >
              ดูผลประเมินจาก {answered} ข้อที่ทำไปแล้ว
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">ระดับปัจจุบัน</p>
              <p className="text-3xl font-bold text-blue-600">{currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                ข้อที่ {Math.min(answered + (result ? 0 : 1), TOTAL_QUESTIONS)} จาก {TOTAL_QUESTIONS}
              </p>
              <p className="text-3xl font-bold text-green-600">
                {correct}/{answered}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((answered / TOTAL_QUESTIONS) * 100, 100)}%` }}
            />
          </div>
        </div>

        {question && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              {question.question}
            </h2>

            <div className="space-y-3 mb-8">
              {question.options.map((option, index) => {
                const isChosen = selected === option.text
                const isRightAnswer =
                  result != null && option.text === result.correctAnswer

                let style = 'border-gray-300 hover:border-blue-400'
                if (result) {
                  if (isRightAnswer) style = 'border-green-500 bg-green-50'
                  else if (isChosen) style = 'border-red-500 bg-red-50'
                  else style = 'border-gray-200 opacity-60'
                } else if (isChosen) {
                  style = 'border-blue-500 bg-blue-50'
                }

                return (
                  <button
                    key={index}
                    onClick={() => !result && setSelected(option.text)}
                    disabled={result != null}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${style} ${
                      result ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span className="font-medium">{option.text}</span>
                  </button>
                )
              })}
            </div>

            {result && (
              <div className="space-y-4 mb-8">
                <div
                  className={`rounded-lg p-4 ${
                    result.isCorrect
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`font-bold mb-2 ${
                      result.isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.isCorrect ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}
                  </p>
                  <p className="text-sm text-gray-700">{result.explanation}</p>
                </div>

                {result.levelChange === 'up' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-bold text-blue-800">
                      🎉 เลื่อนขึ้นระดับ {result.newLevel} แล้ว
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      ตอบถูกติดต่อกัน 3 ข้อ คำถามต่อไปจะยากขึ้น
                    </p>
                  </div>
                )}

                {result.levelChange === 'down' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-bold text-amber-800">
                      ↓ ปรับลงมาที่ระดับ {result.newLevel}
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      ตอบผิดติดต่อกัน 2 ข้อ คำถามต่อไปจะง่ายลง
                    </p>
                  </div>
                )}
              </div>
            )}

            {!result ? (
              <button
                onClick={submitAnswer}
                disabled={!selected || submitting}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'กำลังตรวจ...' : 'ตรวจสอบคำตอบ'}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all"
              >
                {answered >= TOTAL_QUESTIONS ? 'ดูผลประเมินของคุณ' : 'คำถามถัดไป'}
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">ระดับ CEFR ปัจจุบันของคุณ</p>
          <p className="text-lg font-bold text-blue-600">
            {CEFR_DESCRIPTIONS[currentLevel]}
          </p>
        </div>
      </div>
    </div>
  )
}
