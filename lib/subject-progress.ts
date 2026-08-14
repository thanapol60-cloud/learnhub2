import { prisma } from './db'
import { SubjectKey, SUBJECTS, levelsOf } from './subjects'

/**
 * อ่านและเขียนความคืบหน้าของผู้เรียนแบบไม่ต้องสนใจว่าวิชาไหน
 *
 * ภาษาอังกฤษเก็บอยู่ในคอลัมน์ของ User มาแต่เดิม (currentLevel, correctAnswers, ...)
 * ส่วนวิชาที่เพิ่มมาใหม่เก็บในตาราง SubjectProgress หนึ่งแถวต่อผู้เรียนต่อวิชา
 * ตัวช่วยชุดนี้ซ่อนความต่างนั้นไว้ เพื่อให้เส้นทางการสอบเขียนครั้งเดียวใช้ได้ทุกวิชา
 */

export interface Progress {
  subject: SubjectKey
  currentLevel: string
  correctAnswers: number
  wrongAnswers: number
  assessmentStartedAt: Date | null
}

const firstLevel = (subject: SubjectKey) => levelsOf(subject)[0]

export async function getProgress(userId: string, subject: SubjectKey): Promise<Progress | null> {
  if (subject === 'english') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentLevel: true,
        correctAnswers: true,
        wrongAnswers: true,
        assessmentStartedAt: true,
      },
    })
    if (!user) return null
    return { subject, ...user }
  }

  const row = await prisma.subjectProgress.findUnique({
    where: { userId_subject: { userId, subject } },
  })
  if (!row) {
    // ยังไม่เคยสอบวิชานี้ ให้ถือว่าอยู่ระดับแรกและยังไม่มีสถิติ
    return {
      subject,
      currentLevel: firstLevel(subject),
      correctAnswers: 0,
      wrongAnswers: 0,
      assessmentStartedAt: null,
    }
  }
  return {
    subject,
    currentLevel: row.currentLevel,
    correctAnswers: row.correctAnswers,
    wrongAnswers: row.wrongAnswers,
    assessmentStartedAt: row.assessmentStartedAt,
  }
}

/** เริ่มสอบใหม่: กลับไประดับแรกและล้างสถิติของวิชานั้น */
export async function startAttempt(userId: string, subject: SubjectKey): Promise<Date> {
  const startedAt = new Date()
  const level = firstLevel(subject)

  if (subject === 'english') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLevel: level,
        correctAnswers: 0,
        wrongAnswers: 0,
        assessmentCompleted: false,
        assessmentStartedAt: startedAt,
      },
    })
    return startedAt
  }

  await prisma.subjectProgress.upsert({
    where: { userId_subject: { userId, subject } },
    create: {
      userId,
      subject,
      currentLevel: level,
      assessmentStartedAt: startedAt,
    },
    update: {
      currentLevel: level,
      correctAnswers: 0,
      wrongAnswers: 0,
      assessmentStartedAt: startedAt,
    },
  })
  return startedAt
}

export async function recordAnswer(
  userId: string,
  subject: SubjectKey,
  isCorrect: boolean
): Promise<void> {
  const delta = isCorrect
    ? { correctAnswers: { increment: 1 } }
    : { wrongAnswers: { increment: 1 } }

  if (subject === 'english') {
    await prisma.user.update({ where: { id: userId }, data: delta })
    return
  }

  await prisma.subjectProgress.upsert({
    where: { userId_subject: { userId, subject } },
    create: {
      userId,
      subject,
      currentLevel: firstLevel(subject),
      correctAnswers: isCorrect ? 1 : 0,
      wrongAnswers: isCorrect ? 0 : 1,
      assessmentStartedAt: new Date(),
    },
    update: delta,
  })
}

export async function setLevel(
  userId: string,
  subject: SubjectKey,
  level: string
): Promise<void> {
  if (subject === 'english') {
    await prisma.user.update({ where: { id: userId }, data: { currentLevel: level } })
    return
  }

  await prisma.subjectProgress.upsert({
    where: { userId_subject: { userId, subject } },
    create: { userId, subject, currentLevel: level, assessmentStartedAt: new Date() },
    update: { currentLevel: level },
  })
}

export async function markCompleted(userId: string, subject: SubjectKey): Promise<void> {
  // ธง assessmentCompleted มีอยู่เฉพาะกับภาษาอังกฤษ ซึ่งหน้าอื่นใช้ตัดสินใจอยู่แล้ว
  if (subject === 'english') {
    await prisma.user.update({
      where: { id: userId },
      data: { assessmentCompleted: true },
    })
  }
}

/** ระดับถัดขึ้นไปของวิชานั้น คืน null เมื่ออยู่ระดับสูงสุดแล้ว */
export function nextLevelOf(subject: SubjectKey, level: string): string | null {
  const levels = levelsOf(subject)
  const index = levels.indexOf(level)
  return index >= 0 && index < levels.length - 1 ? levels[index + 1] : null
}

/** ระดับถัดลงมา คืนระดับเดิมเมื่ออยู่ระดับต่ำสุดแล้ว */
export function previousLevelOf(subject: SubjectKey, level: string): string {
  const levels = levelsOf(subject)
  const index = levels.indexOf(level)
  return index > 0 ? levels[index - 1] : level
}

export function isLevelOf(subject: SubjectKey, level: string): boolean {
  return SUBJECTS[subject].levels.includes(level)
}
