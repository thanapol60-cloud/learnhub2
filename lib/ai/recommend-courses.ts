import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey, describeLevel } from '../subjects'
import { topicLabel } from '../topics'

/**
 * ตัวแทนที่ 2 — ผู้แนะนำคอร์ส
 *
 * ระบบเดิมจับคู่หัวข้อที่ตอบผิดกับคอร์สแบบตรงตัว แล้วเรียงตามจำนวนข้อที่ครอบคลุม
 * ซึ่งใช้ได้ แต่บอกไม่ได้ว่า "ทำไมควรเรียนตัวนี้ก่อนตัวอื่น" และไม่รู้ว่าหัวข้อไหนเป็นพื้นฐาน
 * ของหัวข้อไหน เช่น ถ้าพลาดทั้ง present simple และ present perfect ควรซ่อม simple ก่อน
 *
 * ตัวนี้รับรายการที่กรองมาแล้วไปจัดลำดับใหม่ตามลำดับการเรียนรู้ พร้อมเขียนเหตุผล
 * ถ้า AI ใช้ไม่ได้ ระบบจะคืนลำดับเดิมที่คำนวณด้วยกฎ ผู้เรียนจึงยังได้คำแนะนำเสมอ
 */

export interface CourseRanking {
  /** เรียงจากคอร์สที่ควรเรียนก่อน */
  ranking: Array<{
    courseId: string
    reason: string
  }>
  /** สรุปภาพรวมว่าควรวางแผนเรียนอย่างไร */
  summary: string
}

export async function rankCourses(input: {
  subject: SubjectKey
  level: string
  weakTopics: Array<{ topic: string; wrong: number; attempted: number }>
  courses: Array<{ id: string; title: string; matchedTopics: string[]; price: number; duration: number }>
  userId?: string
}): Promise<AgentResult<CourseRanking>> {
  const subjectName = SUBJECTS[input.subject].name

  return runAgent<CourseRanking>({
    agent: 'recommend-courses',
    userId: input.userId,
    maxTokens: 900,
    temperature: 0.2,
    system: [
      `คุณเป็นผู้วางแผนการเรียนวิชา${subjectName}`,
      'ผู้เรียนเพิ่งสอบวัดระดับเสร็จ และระบบคัดคอร์สที่ตรงกับจุดอ่อนมาให้แล้ว',
      'หน้าที่ของคุณคือจัดลำดับว่าควรเรียนอะไรก่อนหลัง และอธิบายเหตุผล',
      '',
      'หลักการจัดลำดับ:',
      '- หัวข้อที่เป็นพื้นฐานของหัวข้ออื่นต้องมาก่อนเสมอ',
      '- หัวข้อที่พลาดบ่อยกว่าควรมาก่อน ถ้าไม่ติดเงื่อนไขพื้นฐาน',
      '- คอร์สสั้นที่ปิดช่องว่างได้เร็วควรมาก่อนคอร์สยาว',
      '',
      'กติกา:',
      '- ตอบเป็นภาษาไทย',
      '- ใช้เฉพาะ courseId ที่ให้มาเท่านั้น ห้ามสร้างขึ้นเอง และห้ามตกหล่น',
      '- reason ของแต่ละคอร์สยาวไม่เกิน 1 ประโยค บอกให้ชัดว่าแก้จุดอ่อนข้อไหน',
      '- summary ยาวไม่เกิน 2 ประโยค',
      '',
      'ตอบเป็น JSON: {"ranking": [{"courseId": string, "reason": string}], "summary": string}',
    ].join('\n'),
    user: [
      `ระดับที่วัดได้: ${input.level} (${describeLevel(input.subject, input.level)})`,
      '',
      'จุดอ่อนที่วัดได้:',
      ...input.weakTopics.map(
        (t) => `- ${topicLabel(t.topic)} (${t.topic}): ผิด ${t.wrong} จาก ${t.attempted} ข้อ`
      ),
      '',
      'คอร์สที่เข้าข่าย:',
      ...input.courses.map(
        (c) =>
          `- courseId=${c.id} | ${c.title} | สอนหัวข้อ: ${c.matchedTopics
            .map(topicLabel)
            .join(', ')} | ${c.duration} ชม. | ${c.price} บาท`
      ),
    ].join('\n'),
  })
}
