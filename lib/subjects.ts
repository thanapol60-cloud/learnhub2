/**
 * วิชาและเกณฑ์การวัดระดับของแต่ละวิชา
 *
 * ภาษาอังกฤษใช้ CEFR (A1–C2) ตามเดิม
 * คณิตศาสตร์และวิทยาศาสตร์ใช้เกณฑ์ 6 ระดับที่อิงโครงของ PISA proficiency levels
 * (PISA แบ่งความสามารถทั้งสองวิชาเป็น 6 ระดับพอดี จึงเข้ากับกลไกปรับระดับที่มีอยู่)
 * คำบรรยายแต่ละระดับเรียบเรียงขึ้นเองสำหรับระบบนี้
 */

export type SubjectKey = 'english' | 'math' | 'science'

export interface SubjectDefinition {
  key: SubjectKey
  name: string
  shortName: string
  levels: string[]
  /** ชื่อกรอบมาตรฐานที่ใช้อ้างอิง แสดงให้ผู้เรียนเห็นว่าเกณฑ์มาจากไหน */
  framework: string
  levelDescriptions: Record<string, string>
}

export const SUBJECTS: Record<SubjectKey, SubjectDefinition> = {
  english: {
    key: 'english',
    name: 'ภาษาอังกฤษ',
    shortName: 'อังกฤษ',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    framework: 'CEFR (Common European Framework of Reference)',
    levelDescriptions: {
      A1: 'สื่อสารประโยคพื้นฐานในชีวิตประจำวันได้',
      A2: 'เข้าใจบทสนทนาสั้นและเรื่องใกล้ตัวได้',
      B1: 'รับมือสถานการณ์ทั่วไปและเล่าเรื่องได้',
      B2: 'อภิปรายหัวข้อซับซ้อนได้อย่างคล่องตัว',
      C1: 'ใช้ภาษาเชิงวิชาการและวิชาชีพได้ยืดหยุ่น',
      C2: 'เข้าใจและใช้ภาษาได้ใกล้เคียงเจ้าของภาษา',
    },
  },
  math: {
    key: 'math',
    name: 'คณิตศาสตร์',
    shortName: 'คณิต',
    levels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    framework: 'เกณฑ์ 6 ระดับ อิงโครง PISA Mathematics Literacy',
    levelDescriptions: {
      M1: 'ทำตามขั้นตอนเดียวที่โจทย์บอกชัดเจน และอ่านค่าจากตารางหรือกราฟอย่างง่ายได้',
      M2: 'ตีความโจทย์ที่ตรงไปตรงมา ใช้สูตรพื้นฐาน คิดเศษส่วนและร้อยละได้',
      M3: 'แก้โจทย์หลายขั้นตอนโดยเลือกวิธีเอง และตีความข้อมูลจากแผนภูมิได้',
      M4: 'ทำงานกับแบบจำลองที่กำหนดให้ ใช้สัดส่วน สมการ และเรขาคณิตในบริบทที่ไม่คุ้นเคย',
      M5: 'สร้างแบบจำลองจากสถานการณ์ซับซ้อน ใช้เหตุผลเชิงปริมาณ และตรวจสอบสมมติฐานได้',
      M6: 'สรุปเป็นกรณีทั่วไป ให้เหตุผลเชิงคณิตศาสตร์ และแก้ปัญหาที่ไม่มีวิธีสำเร็จรูป',
    },
  },
  science: {
    key: 'science',
    name: 'วิทยาศาสตร์',
    shortName: 'วิทย์',
    levels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    framework: 'เกณฑ์ 6 ระดับ อิงโครง PISA Science Literacy',
    levelDescriptions: {
      S1: 'ใช้ความรู้วิทยาศาสตร์พื้นฐานอธิบายสิ่งที่พบในชีวิตประจำวันได้',
      S2: 'ระบุตัวแปรของการทดลองง่าย ๆ และอ่านผลจากตารางหรือกราฟได้',
      S3: 'อธิบายปรากฏการณ์ด้วยหลักการทางวิทยาศาสตร์ และตีความข้อมูลการทดลองได้',
      S4: 'ออกแบบการทดลองที่ควบคุมตัวแปร และเชื่อมโยงหลักการหลายเรื่องเข้าด้วยกัน',
      S5: 'ประเมินความน่าเชื่อถือของหลักฐาน และอธิบายกลไกที่ซับซ้อนได้',
      S6: 'วิเคราะห์หลักฐานที่ขัดแย้งกัน สร้างข้อสรุปเชิงวิทยาศาสตร์ และวิจารณ์ข้อจำกัดของงานวิจัย',
    },
  },
}

export const SUBJECT_KEYS = Object.keys(SUBJECTS) as SubjectKey[]

export function isSubjectKey(value: unknown): value is SubjectKey {
  return typeof value === 'string' && value in SUBJECTS
}

/** วิชาของระดับที่ให้มา เช่น "M3" → math ใช้ตอนที่มีแต่ระดับแต่ไม่รู้วิชา */
export function subjectOfLevel(level: string): SubjectKey {
  for (const subject of SUBJECT_KEYS) {
    if (SUBJECTS[subject].levels.includes(level)) return subject
  }
  return 'english'
}

export function levelsOf(subject: SubjectKey): string[] {
  return SUBJECTS[subject].levels
}

export function describeLevel(subject: SubjectKey, level: string): string {
  return SUBJECTS[subject].levelDescriptions[level] ?? level
}
