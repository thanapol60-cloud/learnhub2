'use client'

import { useState, useEffect } from 'react'
import { CEFR_LEVELS, CEFRLevel, CEFR_DESCRIPTIONS } from '@/lib/cefr'

interface Question {
  id: string
  question: string
  options: Array<{ text: string; isCorrect: boolean }>
  explanation: string
  cefrLevel: string
}

interface AssessmentResponse {
  question: Question
  currentLevel: CEFRLevel
  canAdvance: boolean
  progress: number
  totalAnswered: number
}

export default function AssessmentPage() {
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('A1')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [canAdvance, setCanAdvance] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    const loadQuestion = async () => {
      await fetchNextQuestion()
    }
    loadQuestion()
  }, [currentLevel, fetchNextQuestion])

  const fetchNextQuestion = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/question?level=${currentLevel}`)
      const data: AssessmentResponse = await response.json()
      setCurrentQuestion(data.question)
      setCurrentLevel(data.currentLevel)
      setCanAdvance(data.canAdvance)
      setProgress(data.progress)
      setSelectedAnswer(null)
      setAnswered(false)
      setShowExplanation(false)
    } catch (error) {
      console.error('Failed to fetch question:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (optionText: string) => {
    if (!answered) {
      setSelectedAnswer(optionText)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return

    const isCorrect = currentQuestion.options.find(
      (opt) => opt.text === selectedAnswer
    )?.isCorrect

    if (isCorrect) {
      setCorrect(correct + 1)
    }
    setTotal(total + 1)
    setAnswered(true)
    setShowExplanation(true)

    try {
      const response = await fetch('/api/assessment/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
          isCorrect,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentLevel(data.newLevel)
        setCanAdvance(data.canAdvance)
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  const handleNext = () => {
    if (canAdvance && total >= 10) {
      window.location.href = '/result'
    } else {
      fetchNextQuestion()
    }
  }

  const handleAdvanceLevel = async () => {
    try {
      const response = await fetch('/api/assessment/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        fetchNextQuestion()
      }
    } catch (error) {
      console.error('Failed to advance level:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>กำลังเตรียมคำถามสำหรับคุณ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">ระดับปัจจุบัน</p>
              <p className="text-3xl font-bold text-blue-600">{currentLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">คำถามที่ {total}</p>
              <p className="text-3xl font-bold text-green-600">{correct}/{total}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option.text
                const showCorrect =
                  answered && option.isCorrect && isSelected
                const showWrong =
                  answered &&
                  !option.isCorrect &&
                  isSelected
                const shouldHighlightCorrect =
                  answered && option.isCorrect

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.text)}
                    disabled={answered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? showCorrect
                          ? 'border-green-500 bg-green-50'
                          : showWrong
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                        : shouldHighlightCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-blue-400'
                    } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <p className="font-medium">{option.text}</p>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-700">
                  <strong>คำอธิบาย:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!answered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ตรวจสอบคำตอบ
              </button>
            ) : (
              <div className="space-y-3">
                {canAdvance && total >= 10 ? (
                  <>
                    <button
                      onClick={handleNext}
                      className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
                    >
                      ดูผลประเมินของคุณ
                    </button>
                  </>
                ) : canAdvance ? (
                  <>
                    <button
                      onClick={handleAdvanceLevel}
                      className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
                    >
                      ยอมรับ ✓ ไปยังระดับถัดไป
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-full bg-gray-400 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all"
                    >
                      ทำต่อที่ระดับปัจจุบัน
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    คำถามถัดไป
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CEFR Level Info */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-2">ระดับ CEFR ปัจจุบันของคุณ:</p>
          <p className="text-lg font-bold text-blue-600">
            {CEFR_DESCRIPTIONS[currentLevel]}
          </p>
        </div>
      </div>
    </div>
  )
}
