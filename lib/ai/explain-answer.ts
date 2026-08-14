import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey } from '../subjects'
import { topicLabel } from '../topics'

/**
 * ตัวแทนที่ 1 — ผู้อธิบายคำตอบ
 *
 * คำอธิบายที่เก็บไว้ในคลังข้อสอบเป็นคำอธิบายเดียวกันสำหรับทุกคน
 * บอกได้แค่ว่า "ข้อที่ถูกคือข้อนี้เพราะอะไร" แต่ไม่รู้ว่าผู้เรียนคนนี้เข้าใจผิดตรงไหน
 *
 * ตัวนี้รับ "คำตอบที่ผู้เรียนเลือกจริง" เข้าไปด้วย จึงอธิบายได้ว่าตัวเลือกนั้นดึงดูดตรงไหน
 * และผู้เรียนน่าจะสับสนกับหลักการอะไร ซึ่งเป็นข้อมูลที่ช่วยให้แก้ความเข้าใจผิดได้ตรงจุด
 */

export interface Explanation {
  /** อธิบายว่าทำไมตัวเลือกที่ผู้เรียนเลือกจึงผิด */
  whyWrong: string
  /** หลักการที่ต้องจำเพื่อไม่ให้พลาดซ้ำ */
  keyPoint: string
  /** ตัวอย่างสั้นอีกหนึ่งตัวอย่างเพื่อย้ำหลักการ */
  example: string
}

export async function explainAnswer(input: {
  subject: SubjectKey
  level: string
  topic: string | null
  question: string
  passage?: string | null
  userAnswer: string
  correctAnswer: string
  storedExplanation: string
  userId?: string
}): Promise<AgentResult<Explanation>> {
  const subjectName = SUBJECTS[input.subject].name
  const topic = input.topic ? topicLabel(input.topic) : 'ไม่ระบุหัวข้อ'

  return runAgent<Explanation>({
    agent: 'explain-answer',
    userId: input.userId,
    maxTokens: 500,
    temperature: 0.3,
    system: [
      `คุณเป็นติวเตอร์วิชา${subjectName}ที่สอนผู้เรียนไทย`,
      'ผู้เรียนเพิ่งตอบข้อสอบผิด หน้าที่ของคุณคืออธิบายให้เขาเข้าใจว่าพลาดตรงไหน',
      '',
      'กติกา:',
      '- ตอบเป็นภาษาไทยทั้งหมด ยกเว้นศัพท์เฉพาะหรือตัวอย่างประโยคภาษาอังกฤษ',
      '- อธิบายจากตัวเลือกที่เขาเลือกจริง ไม่ใช่อธิบายแค่ว่าข้อถูกคืออะไร',
      '- ใช้ภาษาที่ให้กำลังใจ ไม่ตำหนิ',
      '- แต่ละช่องยาวไม่เกิน 2 ประโยค',
      '- ห้ามบอกว่าคำตอบของเขาถูก ในเมื่อโจทย์ระบุว่าผิด',
      '',
      'ตอบเป็น JSON: {"whyWrong": string, "keyPoint": string, "example": string}',
    ].join('\n'),
    user: [
      `ระดับ: ${input.level}`,
      `หัวข้อที่ข้อนี้วัด: ${topic}`,
      input.passage ? `บทความ: ${input.passage}` : null,
      `โจทย์: ${input.question}`,
      `ผู้เรียนตอบ: ${input.userAnswer}`,
      `คำตอบที่ถูก: ${input.correctAnswer}`,
      `คำอธิบายมาตรฐานที่มีอยู่: ${input.storedExplanation}`,
    ]
      .filter(Boolean)
      .join('\n'),
  })
}
