/**
 * ชั้นค้นคอร์สของแชทบอท — ตอบคำถามที่อ้างถึงคอร์สโดยตรง โดยอ่านจากฐานข้อมูล
 *
 * ก่อนมีชั้นนี้ คำถามอย่าง "คอร์ส ENG11 อยู่ไหน" ตกไปถึงชั้น AI ทุกครั้ง
 * แล้ว AI ตอบว่าไม่ทราบ เพราะถูกสั่งห้ามแต่งข้อมูลและไม่เคยได้รับรายชื่อคอร์สไปด้วย
 * คำตอบจึงถูกตามกติกาแต่ไม่มีประโยชน์ ทั้งที่ข้อมูลอยู่ในตาราง Course อยู่แล้ว
 *
 * ชั้นนี้จึงจับชื่อหรือรหัสคอร์สในคำถาม แล้วตอบด้วยราคา ระดับ และจำนวนวิดีโอจริง
 * ถ้าหาไม่เจอก็บอกตรง ๆ ว่าไม่มีคอร์สชื่อนั้น ซึ่งเป็นคำตอบที่ใช้ตัดสินใจต่อได้
 * ต่างจาก "ไม่ทราบ" ที่ผู้ถามไม่รู้ว่าควรทำอะไรต่อ
 */

import { SUBJECTS, SubjectKey } from './subjects'
import { statusLabel } from './enrollment-status'

export interface CourseInfo {
  id: string
  title: string
  subject: string
  minCefrLevel: string
  maxCefrLevel: string | null
  price: number
  duration: number
  instructorName: string | null
  videoCount: number
}

export interface CourseAnswer {
  answer: string
  link?: { label: string; href: string }
}

/** คำที่บ่งชี้ว่าคำถามพูดถึงคอร์ส รวมคำที่พิมพ์ตกหล่นซึ่งพบบ่อย */
const COURSE_WORDS = ['คอร์ส', 'คอส', 'course', 'วิชานี้', 'บทเรียน', 'คลาส']

/** คำถามที่ขอดูคอร์สทั้งหมด ไม่ได้เจาะจงคอร์สใด */
const CATALOG_WORDS = [
  'มีคอร์สอะไร',
  'คอร์สอะไรบ้าง',
  'คอร์สทั้งหมด',
  'มีคอร์สกี่',
  'คอร์สมีกี่',
  'รายชื่อคอร์ส',
  'คอร์สบ้าง',
  'เปิดสอนอะไร',
  'สอนอะไรบ้าง',
]

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

/**
 * ดึงรหัสคอร์สแบบ "ENG11" ออกจากคำถาม
 *
 * ผู้ถามพิมพ์ทั้ง "ENG11" และ "ENG 11" จึงยุบช่องว่างกับขีดกลางทิ้ง
 * ต้องมีตัวอักษรอย่างน้อยสองตัว เพื่อไม่ให้รหัสระดับอย่าง A1, M3, S6 ถูกจับเป็นรหัสคอร์ส
 */
function extractCodes(question: string): string[] {
  const matches = question.match(/[a-zA-Z]{2,8}[\s-]*\d{1,3}/g) ?? []
  return Array.from(new Set(matches.map((m) => m.toLowerCase().replace(/[\s-]/g, ''))))
}

/** แยกชื่อคอร์สเป็นคำ ๆ ไว้เทียบแบบหลวม ๆ สำหรับคอร์สที่ชื่อยาว */
function titleTokens(title: string): string[] {
  return title
    .split(/[\s,()[\]/:.–—-]+/)
    .map((t) => normalize(t))
    .filter((t) => t.length >= 3)
}

export type CourseMatch =
  | { kind: 'one'; course: CourseInfo }
  | { kind: 'many'; courses: CourseInfo[] }
  | { kind: 'unknown'; code: string }
  | { kind: 'catalog' }

/**
 * หาว่าคำถามอ้างถึงคอร์สไหน คืน null ถ้าไม่ได้ถามเรื่องคอร์สที่เจาะจง
 * (ปล่อยให้ชั้น FAQ และ AI จัดการต่อ)
 */
export function matchCourse(question: string, courses: CourseInfo[]): CourseMatch | null {
  const text = normalize(question)
  const mentionsCourse = COURSE_WORDS.some((w) => text.includes(w))
  const codes = extractCodes(question)
  const asksCatalog = CATALOG_WORDS.some((w) => text.includes(normalize(w)))

  // ถามรวม ๆ ว่ามีอะไรสอนบ้าง ตอบด้วยรายการทั้งหมด ไม่ต้องหาคอร์สเจาะจง
  if (asksCatalog && !mentionsCourse && codes.length === 0) return { kind: 'catalog' }

  if (!mentionsCourse && codes.length === 0) return null

  const hits = new Map<string, CourseInfo>()

  for (const course of courses) {
    const title = normalize(course.title)

    // ชื่อคอร์สปรากฏในคำถามตรง ๆ — แม่นที่สุด
    // ชื่อสั้นกว่าสามตัวอักษรกว้างเกินไป เสี่ยงไปตรงกับคำอื่นในประโยค
    if (title.length >= 3 && text.includes(title)) {
      hits.set(course.id, course)
      continue
    }

    // รหัสในคำถามปรากฏในชื่อคอร์สที่ยาวกว่า เช่นชื่อ "ENG11 Grammar"
    if (codes.some((code) => title.includes(code))) {
      hits.set(course.id, course)
      continue
    }

    // ชื่อยาวที่ผู้ถามพิมพ์มาไม่ครบ — ต้องตรงหลายคำ หรือตรงคำที่ยาวพอจะเจาะจงได้
    if (mentionsCourse) {
      const matched = titleTokens(course.title).filter((t) => text.includes(t))
      if (matched.length >= 2 || matched.some((t) => t.length >= 6)) {
        hits.set(course.id, course)
      }
    }
  }

  const found = Array.from(hits.values())
  if (found.length === 1) return { kind: 'one', course: found[0] }
  if (found.length > 1) return { kind: 'many', courses: found }

  // ถามถึงรหัสที่ไม่มีในระบบ ตอบว่าไม่มีดีกว่าปล่อยให้ AI บอกว่าไม่ทราบ
  if (codes.length > 0 && mentionsCourse) {
    return { kind: 'unknown', code: codes[0].toUpperCase() }
  }

  if (asksCatalog) return { kind: 'catalog' }

  return null
}

function subjectName(subject: string): string {
  return SUBJECTS[subject as SubjectKey]?.name ?? subject
}

function levelRange(course: CourseInfo): string {
  const { minCefrLevel, maxCefrLevel } = course
  return maxCefrLevel && maxCefrLevel !== minCefrLevel
    ? `${minCefrLevel}–${maxCefrLevel}`
    : minCefrLevel
}

function priceText(price: number): string {
  return price === 0 ? 'เรียนฟรี' : `ราคา ${price.toLocaleString('th-TH')} บาท`
}

/** บรรทัดสรุปคอร์สแบบสั้น ใช้ตอนต้องแสดงหลายคอร์สพร้อมกัน */
function shortLine(course: CourseInfo): string {
  return `${course.title} (${subjectName(course.subject)} ระดับ ${levelRange(course)}, ${priceText(course.price)})`
}

/**
 * เรียบเรียงคำตอบภาษาไทยจากผลการค้นหา
 *
 * @param enrolledStatus สถานะการลงทะเบียนของผู้ถามในคอร์สนั้น ถ้ามี
 */
export function formatCourseAnswer(
  match: CourseMatch,
  courses: CourseInfo[],
  enrolledStatus?: Map<string, string>
): CourseAnswer {
  if (match.kind === 'one') {
    const c = match.course
    const parts = [
      `${c.title} เป็นคอร์ส${subjectName(c.subject)} ระดับ ${levelRange(c)}`,
      priceText(c.price),
    ]
    if (c.duration > 0) parts.push(`ใช้เวลาเรียน ${c.duration} ชั่วโมง`)
    parts.push(c.videoCount > 0 ? `มี ${c.videoCount} วิดีโอ` : 'ยังไม่มีวิดีโอในคอร์ส')
    if (c.instructorName) parts.push(`ผู้สอน ${c.instructorName}`)

    const status = enrolledStatus?.get(c.id)
    const tail = status
      ? ` คุณลงทะเบียนคอร์สนี้ไว้แล้ว สถานะคือ "${statusLabel(status)}"`
      : ''

    return {
      answer: parts.join(' ') + tail,
      link: { label: `เปิดคอร์ส ${c.title}`, href: `/courses/${c.id}` },
    }
  }

  if (match.kind === 'many') {
    const list = match.courses.slice(0, 5).map(shortLine).join(' · ')
    const more = match.courses.length > 5 ? ` และอีก ${match.courses.length - 5} คอร์ส` : ''
    return {
      answer: `พบคอร์สที่ตรงกับที่ถาม ${match.courses.length} คอร์ส: ${list}${more} ถ้าอยากดูรายละเอียดคอร์สใดคอร์สหนึ่ง ระบุชื่อคอร์สให้ชัดขึ้นได้`,
      link: { label: 'ดูคอร์สทั้งหมด', href: '/courses' },
    }
  }

  if (match.kind === 'unknown') {
    if (courses.length === 0) {
      return {
        answer: `ยังไม่มีคอร์สชื่อ "${match.code}" ในระบบ และตอนนี้ยังไม่มีคอร์สใดเปิดสอนเลย`,
        link: { label: 'ดูหน้าคอร์ส', href: '/courses' },
      }
    }
    const sample = courses.slice(0, 5).map((c) => c.title).join(', ')
    const more = courses.length > 5 ? ` และอีก ${courses.length - 5} คอร์ส` : ''
    return {
      answer: `ยังไม่มีคอร์สชื่อ "${match.code}" ในระบบ ตอนนี้เปิดสอน ${courses.length} คอร์ส ได้แก่ ${sample}${more}`,
      link: { label: 'ดูคอร์สทั้งหมด', href: '/courses' },
    }
  }

  // ถามถึงคอร์สทั้งหมด
  if (courses.length === 0) {
    return {
      answer: 'ตอนนี้ยังไม่มีคอร์สเปิดสอนในระบบ',
      link: { label: 'ดูหน้าคอร์ส', href: '/courses' },
    }
  }
  const list = courses.slice(0, 8).map(shortLine).join(' · ')
  const more = courses.length > 8 ? ` และอีก ${courses.length - 8} คอร์ส` : ''
  return {
    answer: `ตอนนี้เปิดสอน ${courses.length} คอร์ส: ${list}${more}`,
    link: { label: 'ดูคอร์สทั้งหมด', href: '/courses' },
  }
}

/**
 * คำถามนี้ควรไปแตะฐานข้อมูลคอร์สไหม
 *
 * ใช้กรองก่อนยิงคิวรี เพื่อไม่ให้ทุกข้อความในแชทต้องอ่านตาราง Course
 */
export function looksLikeCourseQuestion(question: string): boolean {
  const text = normalize(question)
  return (
    COURSE_WORDS.some((w) => text.includes(w)) ||
    CATALOG_WORDS.some((w) => text.includes(normalize(w))) ||
    extractCodes(question).length > 0
  )
}
