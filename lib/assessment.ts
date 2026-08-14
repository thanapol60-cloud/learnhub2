import { CEFRLevel, CEFR_LEVELS } from './cefr'

export interface AssessmentState {
  currentLevel: CEFRLevel
  consecutiveCorrect: number
  consecutiveWrong: number
  totalAnswered: number
  correct: number
  wrong: number
  canAdvance: boolean
}

const QUESTIONS_BEFORE_ADVANCE = 3
const CONSECUTIVE_WRONG_BEFORE_DEMOTE = 2

/**
 * จำนวนข้อต่อการประเมินหนึ่งครั้ง
 *
 * ยิ่งมากยิ่งวัดระดับได้นิ่งขึ้น เพราะการเดาถูกสองสามข้อจะไม่ดันระดับทั้งชุด
 * เพดานคือจำนวนข้อที่มีในหนึ่งระดับ (ตอนนี้ระดับละ 35 ข้อ) เพราะผู้เรียนที่อยู่
 * ระดับเดิมทั้งชุดต้องได้ข้อใหม่ทุกข้อโดยไม่ซ้ำ ถ้าตั้งเกินจำนวนนั้นข้อสอบจะหมดกลางคัน
 */
export const TOTAL_QUESTIONS_PER_ATTEMPT = 25

export function initializeAssessment(startLevel: CEFRLevel = 'A1'): AssessmentState {
  return {
    currentLevel: startLevel,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalAnswered: 0,
    correct: 0,
    wrong: 0,
    canAdvance: false,
  }
}

export function updateAssessmentState(
  state: AssessmentState,
  isCorrect: boolean
): AssessmentState {
  const newState = { ...state }
  newState.totalAnswered += 1

  if (isCorrect) {
    newState.correct += 1
    newState.consecutiveCorrect += 1
    newState.consecutiveWrong = 0

    if (newState.consecutiveCorrect >= QUESTIONS_BEFORE_ADVANCE) {
      newState.canAdvance = true
    }
  } else {
    newState.wrong += 1
    newState.consecutiveWrong += 1
    newState.consecutiveCorrect = 0

    if (newState.consecutiveWrong >= CONSECUTIVE_WRONG_BEFORE_DEMOTE) {
      newState.currentLevel = demoteLevel(newState.currentLevel)
      newState.canAdvance = false
    }
  }

  return newState
}

export function advanceLevel(state: AssessmentState): AssessmentState {
  const nextLevel = getNextLevel(state.currentLevel)
  if (!nextLevel) {
    return state
  }

  return {
    ...state,
    currentLevel: nextLevel,
    consecutiveCorrect: 0,
    canAdvance: false,
  }
}

export function demoteLevel(level: CEFRLevel): CEFRLevel {
  const currentIndex = CEFR_LEVELS.indexOf(level)
  if (currentIndex > 0) {
    return CEFR_LEVELS[currentIndex - 1]
  }
  return level
}

export function getNextLevel(level: CEFRLevel): CEFRLevel | null {
  const currentIndex = CEFR_LEVELS.indexOf(level)
  if (currentIndex < CEFR_LEVELS.length - 1) {
    return CEFR_LEVELS[currentIndex + 1]
  }
  return null
}

export function getAssessmentProgress(state: AssessmentState): number {
  const levelIndex = CEFR_LEVELS.indexOf(state.currentLevel)
  const progress = (levelIndex / CEFR_LEVELS.length) * 100
  return Math.round(progress)
}

export function formatAssessmentResult(state: AssessmentState) {
  const accuracy = state.totalAnswered > 0 ? (state.correct / state.totalAnswered) * 100 : 0

  return {
    cefrLevel: state.currentLevel,
    totalQuestions: state.totalAnswered,
    correctAnswers: state.correct,
    wrongAnswers: state.wrong,
    accuracy: Math.round(accuracy),
    canAdvanceFurther: getNextLevel(state.currentLevel) !== null,
  }
}
