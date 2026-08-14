import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey } from '../subjects'

/**
 * ตัวแทนที่ 5 — ผู้จัดระดับเนื้อหา
 *
 * แทนที่ lib/ai-analysis.ts ตัวเดิม ซึ่งเรียกโมเดล claude-3-5-sonnet-20241022
 * ที่ถูกปลดระวางไปแล้ว จึงได้ 404 ทุกครั้งแล้วตกไปใช้ fallback ที่คืนค่า "B1" เสมอ
 * ผู้ดูแลเห็นตัวเลขขึ้นมาก็เข้าใจว่าระบบวิเคราะห์ให้แล้ว ทั้งที่ไม่เคยเรียกสำเร็จเลย
 *
 * ตัวนี้คืนสถานะความล้มเหลวออกไปตรง ๆ หน้าเว็บจึงแสดงได้ว่า "วิเคราะห์ไม่สำเร็จ"
 * แทนที่จะแสดงค่าที่ดูเหมือนจริงแต่ไม่มีที่มา
 */

export interface VideoClassification {
  level: string
  /** ความมั่นใจ 0–100 */
  confidence: number
  /** เหตุผลที่เลือกระดับนี้ */
  reasoning: string
  /** หัวข้อที่คลิปนี้น่าจะสอน ใช้จับคู่กับข้อสอบได้ */
  suggestedTopics: string[]
}

export async function classifyVideo(input: {
  subject: SubjectKey
  title: string
  description?: string | null
  durationSeconds?: number
  userId?: string
}): Promise<AgentResult<VideoClassification>> {
  const definition = SUBJECTS[input.subject]

  const result = await runAgent<VideoClassification>({
    agent: 'classify-video',
    userId: input.userId,
    maxTokens: 500,
    temperature: 0.1, // งานจัดระดับต้องได้ผลใกล้เคียงกันทุกครั้งที่ป้อนข้อมูลเดิม
    system: [
      `คุณเป็นผู้เชี่ยวชาญด้านการจัดระดับสื่อการเรียนวิชา${definition.name}`,
      `ใช้เกณฑ์ ${definition.framework} ซึ่งมี ${definition.levels.length} ระดับ`,
      '',
      'คำบรรยายแต่ละระดับ:',
      ...definition.levels.map((level) => `- ${level}: ${definition.levelDescriptions[level]}`),
      '',
      'กติกา:',
      `- level ต้องเป็นหนึ่งใน ${definition.levels.join(', ')} เท่านั้น`,
      '- confidence เป็นตัวเลข 0 ถึง 100 ถ้าข้อมูลน้อย ให้ค่าต่ำตามจริง อย่าเดาสูงเกิน',
      '- reasoning เป็นภาษาไทย ไม่เกิน 2 ประโยค บอกว่าดูจากอะไร',
      '- suggestedTopics เป็นคำสั้น ๆ ภาษาไทย ไม่เกิน 3 หัวข้อ',
      '',
      'ตอบเป็น JSON: {"level": string, "confidence": number, "reasoning": string, "suggestedTopics": [string]}',
    ].join('\n'),
    user: [
      `ชื่อคลิป: ${input.title}`,
      input.description ? `คำอธิบาย: ${input.description}` : 'ไม่มีคำอธิบาย',
      input.durationSeconds ? `ความยาว: ${Math.round(input.durationSeconds / 60)} นาที` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  // ตรวจว่าโมเดลตอบระดับที่มีอยู่จริง ถ้าไม่ใช่ถือว่าล้มเหลว ดีกว่าบันทึกค่าที่ใช้ไม่ได้
  if (result.status === 'ok' && result.data) {
    if (!definition.levels.includes(result.data.level)) {
      return {
        ...result,
        status: 'error',
        data: null,
        message: `โมเดลตอบระดับ "${result.data.level}" ซึ่งไม่มีในเกณฑ์ของวิชานี้`,
      }
    }
    result.data.confidence = Math.max(0, Math.min(100, Number(result.data.confidence) || 0))
  }

  return result
}
