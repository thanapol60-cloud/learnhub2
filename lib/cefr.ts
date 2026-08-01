export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CEFRLevel = typeof CEFR_LEVELS[number]

export const CEFR_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: 'Elementary (A1) - เบื้องต้น',
  A2: 'Elementary (A2) - เบื้องต้น',
  B1: 'Intermediate (B1) - ระดับกลาง',
  B2: 'Upper Intermediate (B2) - ระดับกลางสูง',
  C1: 'Advanced (C1) - ขั้นสูง',
  C2: 'Proficiency (C2) - ระดับเชี่ยวชาญ',
}

export const CEFR_SCORE_RANGES: Record<CEFRLevel, [number, number]> = {
  A1: [0, 20],
  A2: [21, 40],
  B1: [41, 60],
  B2: [61, 75],
  C1: [76, 90],
  C2: [91, 100],
}

export interface AssessmentStats {
  total: number
  correct: number
  accuracy: number
  cefrLevel: CEFRLevel
}

export function calculateCEFRLevel(correct: number, total: number): CEFRLevel {
  if (total === 0) return 'A1'

  const accuracy = (correct / total) * 100

  for (const [level, [min, max]] of Object.entries(CEFR_SCORE_RANGES)) {
    if (accuracy >= min && accuracy <= max) {
      return level as CEFRLevel
    }
  }

  return 'C2'
}

export function getNextLevel(current: CEFRLevel): CEFRLevel | null {
  const currentIndex = CEFR_LEVELS.indexOf(current)
  if (currentIndex < CEFR_LEVELS.length - 1) {
    return CEFR_LEVELS[currentIndex + 1]
  }
  return null
}

export function getPreviousLevel(current: CEFRLevel): CEFRLevel | null {
  const currentIndex = CEFR_LEVELS.indexOf(current)
  if (currentIndex > 0) {
    return CEFR_LEVELS[currentIndex - 1]
  }
  return null
}

export function shouldAdvanceLevel(correct: number, total: number, threshold = 0.8): boolean {
  if (total === 0) return false
  const accuracy = correct / total
  return accuracy >= threshold
}

export function shouldDemoteLevel(correct: number, total: number, threshold = 0.5): boolean {
  if (total === 0) return false
  const accuracy = correct / total
  return accuracy < threshold
}
